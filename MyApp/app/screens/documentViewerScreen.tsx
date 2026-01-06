import React, { FC, useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';

// 1. Sửa lỗi 2344: Định nghĩa lại kiểu params để tương thích với Expo Router
type DocumentParams = {
  title?: string;
  url?: string; 
};

const DocumentViewerScreen: FC = () => {
  const router = useRouter();
  
  // 2. Ép kiểu params khi sử dụng
  const params = useLocalSearchParams<DocumentParams>(); 
  const title = Array.isArray(params.title) ? params.title[0] : params.title;
  const url = Array.isArray(params.url) ? params.url[0] : params.url;

  const [loading, setLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const getMimeType = (extension: string) => {
      switch (extension.toLowerCase()) {
          case 'pdf': return 'application/pdf';
          case 'doc': 
          case 'docx': return 'application/msword';
          case 'xls': 
          case 'xlsx': return 'application/vnd.ms-excel';
          case 'ppt': 
          case 'pptx': return 'application/vnd.ms-powerpoint';
          case 'jpg': 
          case 'jpeg': return 'image/jpeg';
          case 'png': return 'image/png';
          default: return '*/*';
      }
  };

  const downloadAndOpenDocument = async () => {
    if (!url) {
      Alert.alert('Lỗi', 'Không tìm thấy đường dẫn tài liệu.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const fileExtension = url.split('.').pop()?.split(/\#|\?/)[0] || 'pdf'; 
      const fileName = `${title?.replace(/[^a-z0-9]/gi, '_') || 'document'}.${fileExtension}`;
      
      // 3. Sửa lỗi 2339: Xử lý documentDirectory an toàn hơn
      // FileSystem.documentDirectory có thể null trên web hoặc một số môi trường
      const folder = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
      
      if (!folder) {
          throw new Error('Thiết bị không hỗ trợ lưu trữ file cục bộ.');
      }
      
      const localUri = folder + fileName;

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        localUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setDownloadProgress(progress);
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (!result || !result.uri) {
        throw new Error('Không thể tải file.');
      }

      setLoading(false);

      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(result.uri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1, 
          type: getMimeType(fileExtension), 
        });
      } else {
        await Sharing.shareAsync(result.uri, {
            UTI: 'com.adobe.pdf',
            mimeType: getMimeType(fileExtension),
        });
      }

    } catch (e) {
      console.error(e);
      setLoading(false);
      Alert.alert('Lỗi', 'Không thể mở tài liệu này.');
    }
  };
  
  useEffect(() => {
    downloadAndOpenDocument();
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#000080" />
        </TouchableOpacity>
        {/* Đảm bảo Text được bọc đúng */}
        <Text style={styles.headerTitle} numberOfLines={1}>{title || 'Tài liệu'}</Text>
        <View style={{width: 24}} />
      </View>

      {/* Nội dung */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#000080" />
            <Text style={styles.statusText}>
                Đang tải tài liệu... {Math.round(downloadProgress * 100)}%
            </Text>
            <Text style={styles.subText}>Vui lòng đợi trong giây lát.</Text>
          </View>
        ) : (
          <View style={styles.centerContent}>
            <Ionicons name="document-text-outline" size={80} color="#000080" />
            <Text style={styles.statusText}>Đã tải xong!</Text>
            <Text style={styles.subText}>Tài liệu sẽ tự động mở.</Text>
            
            <TouchableOpacity style={styles.openButton} onPress={downloadAndOpenDocument}>
                <Text style={styles.openButtonText}>Mở Tài Liệu</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 15,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1A1A1A',
      maxWidth: '70%',
  },
  content: {
    flex: 1,
    padding: 30,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  subText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  openButton: {
    backgroundColor: '#000080',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    elevation: 3,
  },
  openButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default DocumentViewerScreen;