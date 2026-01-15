// app/context/NotificationContext.tsx

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Định nghĩa kiểu dữ liệu Notification
export interface NotificationItemType {
  id: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  detail: string;
  time: string;
  isRead: boolean;
}

interface NotificationContextType {
  notifications: NotificationItemType[];
  addNotification: (item: Omit<NotificationItemType, 'id' | 'time' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationItemType[]>([]);

  // Load thông báo từ bộ nhớ khi mở app
  useEffect(() => {
    const loadNotis = async () => {
      const stored = await AsyncStorage.getItem('user_notifications');
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    };
    loadNotis();
  }, []);

  // Hàm thêm thông báo mới
  const addNotification = async (item: Omit<NotificationItemType, 'id' | 'time' | 'isRead'>) => {
    const newNoti: NotificationItemType = {
      id: Date.now().toString(), // Tạo ID duy nhất dựa trên thời gian
      time: 'Vừa xong',
      isRead: false,
      ...item,
    };

    // Thêm vào đầu danh sách (mới nhất lên trên)
    const updatedList = [newNoti, ...notifications];
    setNotifications(updatedList);
    await AsyncStorage.setItem('user_notifications', JSON.stringify(updatedList));
  };

  // Hàm đánh dấu đã đọc
  const markAsRead = async (id: string) => {
    const updatedList = notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    );
    setNotifications(updatedList);
    await AsyncStorage.setItem('user_notifications', JSON.stringify(updatedList));
  };

  const clearNotifications = async () => {
    setNotifications([]); // Xóa state
    await AsyncStorage.removeItem('user_notifications'); // Xóa bộ nhớ
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};