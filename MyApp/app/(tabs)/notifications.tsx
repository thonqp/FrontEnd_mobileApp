// app/(tabs)/notifications.tsx

import React, { FC } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  FlatList,
  Alert,
  TouchableOpacity,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NotificationItem from '../components/NotificationItem'; // Đảm bảo đúng đường dẫn

// Import Context
import { useNotification, NotificationItemType } from '../context/NotificationContext';


const NotificationScreen: FC = () => {
  // Lấy danh sách thông báo và hàm đánh dấu đã đọc từ Context
  const { notifications, markAsRead, clearNotifications } = useNotification(); 
  
  const handleClearAll = () => {
    Alert.alert(
        "Xóa thông báo",
        "Bạn có chắc muốn xóa tất cả thông báo không?",
        [
            { text: "Hủy", style: "cancel" },
            { text: "Xóa", style: "destructive", onPress: clearNotifications }
        ]
    );
  };

  const handleNotificationPress = (id: string) => {
    markAsRead(id); // Đánh dấu đã đọc khi bấm vào
    // Logic điều hướng nếu cần (ví dụ mở chi tiết tài liệu)
  };
  
  const renderItem = ({ item }: { item: NotificationItemType }) => (
    <NotificationItem notification={item} onPress={handleNotificationPress} />
  );
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClearAll} style={{position: 'absolute', right: 20}}>
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
      </View>

      <FlatList
        data={notifications} // <--- Dùng dữ liệu thật
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={50} color="#ccc" />
                <Text style={styles.emptyText}>Không có thông báo nào.</Text>
            </View>
        }
      />
    </SafeAreaView>
  );
};

// --- STYLING ---

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8', // Màu nền nhẹ
    paddingTop: Platform.OS === 'android' ? 50 : 10,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  listContent: {
    paddingBottom: 20, // Khoảng trống cuối danh sách
  },
  emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 50,
  },
  emptyText: {
      fontSize: 16,
      color: '#6c757d',
  }
});

export default NotificationScreen;