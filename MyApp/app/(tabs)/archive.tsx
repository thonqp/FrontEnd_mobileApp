import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import CustomSwitchBar, { SwitchTabName } from '../components/CustomSwitchBar';
import FolderListItem from '../components/FolderListItem';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDocumentDetail, rateDocument } from '../services/documentService';
import RatingModal from '../components/RatingModal';
import { useNotification } from '../context/NotificationContext';
import { useHistory } from '../context/HistoryContext';
// ✅ Import Legacy cho SDK 54+ (Nếu dùng SDK mới nhất)
import * as FileSystem from 'expo-file-system/legacy';

import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';

// --- INTERFACES ---
interface BackendDocument {
  documentId: number;
  title: string;
  fileType: string;
  filePath: string;
  fileSize: number;
  createdAt: string;
}

interface ArchiveItem {
  id: string;
  documentId?: number; // <--- TRƯỜNG MỚI ĐỂ LIÊN KẾT SERVER
  title: string;
  subtitle: string;
  type: 'folder' | 'file';
  color: string;
  isShared: boolean;
  fileUrl?: string;
  localUri?: string;
  fileName?: string;
}

// --- CONFIG HỖ TRỢ FILE ---
// Các đuôi file mà OS (Android/iOS) thường hỗ trợ xem trực tiếp
const SUPPORTED_EXTENSIONS = [
  'pdf', 
  'doc', 'docx', 
  'jpg', 'jpeg', 'png', 'heic',
  'txt',
  'ppt', 'pptx', // Powerpoint
  'xls', 'xlsx'  // Excel
];

// Hàm kiểm tra xem file có được hỗ trợ không
const isSupportedFile = (filename: string | null | undefined): boolean => {
  if (!filename) return false;
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? SUPPORTED_EXTENSIONS.includes(extension) : false;
};

// --- HELPER FUNCTIONS ---
const formatFileSize = (size: number) => {
  if (!size) return 'Unknown';
  if (size >= 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + ' MB';
  if (size >= 1024) return (size / 1024).toFixed(2) + ' KB';
  return size + ' Bytes';
};

const getFileColor = (filenameOrType: string) => {
  const type = filenameOrType ? filenameOrType.toLowerCase() : '';
  if (type.includes('pdf')) return '#F44336';
  if (type.includes('doc')) return '#2196F3';
  if (type.includes('xls')) return '#4CAF50';
  if (type.includes('ppt')) return '#FF9800';
  if (type.includes('png') || type.includes('jpg')) return '#E91E63';
  return '#000080';
};

const getMimeType = (url: string) => {
  const ext = url.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'doc':
    case 'docx': return 'application/msword';
    case 'xls':
    case 'xlsx': return 'application/vnd.ms-excel';
    case 'ppt':
    case 'pptx': return 'application/vnd.ms-powerpoint';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'txt': return 'text/plain';
    default: return '*/*';
  }
};

// --- COMPONENT CHÍNH ---
export default function ArchiveScreen() {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<SwitchTabName>('Tài liệu của tôi');
  const [searchText, setSearchText] = useState('');
  
  const [localFiles, setLocalFiles] = useState<ArchiveItem[]>([]);
  const [apiFiles, setApiFiles] = useState<ArchiveItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // State cho Rating
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedDocForRating, setSelectedDocForRating] = useState<ArchiveItem | null>(null);
  const [isRatingLoading, setIsRatingLoading] = useState(false);

  const { addNotification } = useNotification();

  const { addToHistory } = useHistory();

  // Tự động load lại dữ liệu mỗi khi vào Tab
  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'Tài liệu của tôi') {
        fetchLocalFiles();
      } else {
        fetchApiDocuments();
      }
    }, [activeTab, user])
  );

  // --- 1. XỬ LÝ FILE LOCAL (Tài liệu của tôi) ---
  const fetchLocalFiles = async () => {
    try {
      setIsLoading(true);
      const docDir = FileSystem.documentDirectory;
      if (!docDir) return;

      // A. Lấy danh sách file vật lý
      const files = await FileSystem.readDirectoryAsync(docDir);

      // B. Lấy metadata đã lưu (chứa documentId) từ AsyncStorage
      // Key này phải khớp với lúc bạn lưu ở SearchScreen
      const savedDocsJson = await AsyncStorage.getItem('my_saved_documents'); 
      const savedDocsMetadata = savedDocsJson ? JSON.parse(savedDocsJson) : [];

      const items: ArchiveItem[] = [];
      
      for (const file of files) {
        if (file.startsWith('.')) continue;
        if (!isSupportedFile(file)) continue;

        // C. Tìm metadata khớp với file này để lấy documentId
        // Logic khớp: localUri chứa tên file HOẶC title + id trùng khớp (tùy cách bạn lưu)
        // Cách đơn giản nhất: check xem trong savedDocsMetadata có item nào mà fileName trùng không
        const metadata = savedDocsMetadata.find((doc: any) => {
             // doc.localUri dạng ".../abc.pdf", file dạng "abc.pdf"
             return doc.localUri && doc.localUri.endsWith(file);
        });

        const fileUri = docDir + file;
        const info = await FileSystem.getInfoAsync(fileUri);
        
        if (info.exists && !info.isDirectory) {
          items.push({
            id: file,
            documentId: metadata ? metadata.documentId : undefined, // <--- Gán ID nếu tìm thấy
            title: metadata ? metadata.title : file, // Dùng tên gốc đẹp hơn nếu có
            subtitle: `${formatFileSize(info.size || 0)} • Đã tải về`,
            type: 'file',
            color: getFileColor(file),
            isShared: false,
            localUri: fileUri,
            fileName: file
          });
        }
      }
      setLocalFiles(items);
    } catch (error) {
      console.error('Lỗi đọc file local:', error);
    } finally {
      setIsLoading(false);
    }
  };



  // --- 2. LOGIC KIỂM TRA SERVER VÀ MỞ RATING ---
  const handleCheckAndRate = async (item: ArchiveItem) => {
      // Chỉ cho phép rate nếu có documentId (nghĩa là file được tải từ app, không phải copy paste vào)
      if (!item.documentId) {
          Alert.alert("Thông báo", "Tài liệu này không có thông tin trên hệ thống để đánh giá.");
          return;
      }

      setIsRatingLoading(true);
      try {
          // Gọi API kiểm tra tồn tại
          const docData = await getDocumentDetail(item.documentId);
          
          if (docData) {
              // Tồn tại -> Mở modal
              setSelectedDocForRating(item);
              setRatingModalVisible(true);
          } else {
              // Không tồn tại (null)
              Alert.alert(
                  "Rất tiếc", 
                  "Tài liệu này đã bị xóa hoặc không còn tồn tại trên hệ thống máy chủ."
              );
          }
      } catch (error) {
          Alert.alert("Lỗi", "Không thể kết nối đến máy chủ.");
      } finally {
          setIsRatingLoading(false);
      }
  };

  const submitRating = async (rating: number, comment: string) => {
      if (!user || !selectedDocForRating?.documentId) return;
      
      setIsRatingLoading(true);
      try {
          await rateDocument(user.userId, selectedDocForRating.documentId, rating, comment);
          addNotification({
              title: 'Đánh giá thành công',
              detail: `Bạn đã đánh giá ${rating} sao cho tài liệu "${selectedDocForRating.title}"`,
              iconName: 'star', // Icon ngôi sao
              iconColor: '#FFC107', // Màu vàng
          });
          Alert.alert("Thành công", "Cảm ơn bạn đã đánh giá tài liệu!");
          setRatingModalVisible(false);
      } catch (error: any) {
          Alert.alert("Thất bại", error.message);
      } finally {
          setIsRatingLoading(false);
      }
  };


  // --- 3. XỬ LÝ MENU KHI BẤM VÀO 3 CHẤM ---
  const handleMenuPress = (item: ArchiveItem) => {
    // Sử dụng Alert.alert để tạo menu đơn giản cho cả Android/iOS
    Alert.alert(
        item.title,
        "Chọn hành động",
        [
            { text: "Hủy", style: "cancel" },
            { 
                text: "Đánh giá tài liệu", 
                onPress: () => handleCheckAndRate(item) // Gọi hàm check
            },
            { 
                text: "Xóa khỏi máy", 
                style: 'destructive',
                onPress: () => console.log("Logic xóa file ở đây") 
            },
        ]
    );
  };

  // --- 2. XỬ LÝ FILE API (Tài liệu đã chia sẻ) ---
  const fetchApiDocuments = async () => {
    if (!user || !user.userId) return;
    try {
      setIsLoading(true);
      const url = `https://bk-sharing-app.fly.dev/api/v1/documents/user/${user.userId}`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        const documents: BackendDocument[] = result.data;
        const mappedData: ArchiveItem[] = documents.map((doc) => {
          let fileName = doc.title;
          // Xử lý tên file hiển thị nếu thiếu đuôi
          if (!fileName.includes('.')) {
             if (doc.fileType.includes('pdf')) fileName += '.pdf';
             else if (doc.fileType.includes('image')) fileName += '.png';
             else if (doc.fileType.includes('word')) fileName += '.docx';
             else fileName += '.bin';
          }

          return {
            id: doc.documentId.toString(),
            title: doc.title || fileName,
            subtitle: `${formatFileSize(doc.fileSize)} • ${new Date(doc.createdAt).toLocaleDateString('vi-VN')}`,
            type: 'file',
            color: getFileColor(doc.fileType),
            isShared: true,
            fileUrl: doc.filePath,
            fileName: fileName 
          };
        });
        setApiFiles(mappedData);
      } else {
        setApiFiles([]);
      }
    } catch (error) {
      console.error('Lỗi fetch API:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách online');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. HÀM MỞ FILE VỚI OS DEFAULT ---
  const openFileWithOS = async (fileUri: string, item?: ArchiveItem) => {
    try {

      if (item) {
        addToHistory({
            id: item.id, // Hoặc item.documentId?.toString() nếu có
            title: item.title,
            subtitle: item.subtitle || item.type, // Ví dụ: "PDF • 2MB"
            rating: 0, // Mặc định chưa có rating
            // time: new Date().toISOString(),
            color: item.color,
            fileUri: fileUri // Lưu đường dẫn để mở lại sau này
        });
      }


      if (Platform.OS === 'android') {
        const cUri = await FileSystem.getContentUriAsync(fileUri);
        const mimeType = getMimeType(fileUri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: cUri,
          flags: 1,
          type: mimeType,
        });
      } else {
        await Sharing.shareAsync(fileUri);
      }
    } catch (e) {
      console.error("Không thể mở file:", e);
      Alert.alert('Không thể mở file', 'Thiết bị chưa cài ứng dụng hỗ trợ định dạng này.');
    }
  };

  // --- 4. XỬ LÝ KHI BẤM VÀO ITEM ---
  const handleItemPress = async (item: ArchiveItem) => {
    // TH1: File trong máy -> Mở luôn
    if (activeTab === 'Tài liệu của tôi' && item.localUri) {
      await openFileWithOS(item.localUri, item);
      return;
    }

    // TH2: File trên mạng -> Tải về rồi mở
    if (activeTab === 'Tài liệu đã chia sẻ' && item.fileUrl && item.fileName) {
      const docDir = FileSystem.documentDirectory;
      if (!docDir) {
        Alert.alert('Lỗi', 'Không xác định được thư mục lưu trữ.');
        return;
      }

      const localUri = docDir + item.fileName;
      
      try {
        const fileInfo = await FileSystem.getInfoAsync(localUri);

        if (fileInfo.exists) {
          // File đã có sẵn -> Mở luôn
          await openFileWithOS(localUri, item);
        } else {
          // Chưa có -> Tải về
          setIsDownloading(true);
          const downloadRes = await FileSystem.downloadAsync(
            item.fileUrl,
            localUri
          );
          setIsDownloading(false);
          
          if (downloadRes.status === 200) {
            Alert.alert(
              'Tải thành công', 
              'File đã được lưu vào "Tài liệu của tôi". Bạn có muốn mở ngay không?', 
              [
                { text: 'Để sau', style: 'cancel' },
                { text: 'Mở ngay', onPress: () => openFileWithOS(localUri, item) }
              ]
            );
            // Refresh lại list local nếu đang cần thiết (nhưng ở đây đang ở tab chia sẻ)
          } else {
            Alert.alert('Lỗi', 'Tải file thất bại.');
          }
        }
      } catch (error) {
        setIsDownloading(false);
        console.error(error);
        Alert.alert('Lỗi', 'Có lỗi xảy ra khi xử lý file.');
      }
    }
  };

  const handleTabChange = (tabName: SwitchTabName) => {
    setActiveTab(tabName);
    setSearchText('');
  };

  const currentData = activeTab === 'Tài liệu của tôi' ? localFiles : apiFiles;
  const filteredData = currentData.filter(item => 
    item.title.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lưu trữ</Text>
      </View>

      <View style={styles.switchBarWrapper}>
        <CustomSwitchBar activeTab={activeTab} onTabChange={handleTabChange} />
      </View>

      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={activeTab === 'Tài liệu của tôi' ? "Tìm trong máy..." : "Tìm trên Cloud..."}
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Feather name="x-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {(isLoading || isDownloading) && (
        <View style={styles.loadingOverlay}>
             <ActivityIndicator size="large" color="#000080" />
             <Text style={{marginTop: 10, color: '#000080', fontWeight: 'bold'}}>
                {isDownloading ? "Đang tải file về máy..." : "Đang cập nhật danh sách..."}
             </Text>
        </View>
      )}

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
            <FolderListItem 
                item={item} 
                onPress={handleItemPress} 
                onMenuPress={() => handleMenuPress(item)}
            />
        )}
        contentContainerStyle={styles.listContent}
        refreshing={isLoading}
        onRefresh={activeTab === 'Tài liệu của tôi' ? fetchLocalFiles : fetchApiDocuments}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name={activeTab === 'Tài liệu của tôi' ? "phone-portrait-outline" : "cloud-offline-outline"} size={80} color="#ccc" />
              <Text style={styles.emptyText}>
                  {activeTab === 'Tài liệu của tôi' 
                    ? 'Chưa có tài liệu nào trong máy.' 
                    : 'Không tìm thấy tài liệu trên hệ thống.'}
              </Text>
            </View>
          ) : null
        }
      />

      {/* MODAL RATING */}
      <RatingModal 
        visible={ratingModalVisible}
        onClose={() => setRatingModalVisible(false)}
        onSubmit={submitRating}
        loading={isRatingLoading}
        documentTitle={selectedDocForRating?.title}
      />


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 50 : 10,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  searchBarContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
  },
  switchBarWrapper: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 250,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 20,
    borderRadius: 10,
  }
});