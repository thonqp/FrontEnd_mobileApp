// app/context/HistoryContext.tsx

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RecentItemType {
  id: string; // documentId
  title: string;
  subtitle: string; // File type hoặc size
  rating?: number;
  time: string; // Thời gian xem
  color: string;
  fileUri?: string; // Để mở lại
}

interface HistoryContextType {
  recentItems: RecentItemType[];
  addToHistory: (item: Omit<RecentItemType, 'time'>) => void;
  clearHistory: () => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (!context) throw new Error('useHistory must be used within a HistoryProvider');
  return context;
};

export const HistoryProvider = ({ children }: { children: ReactNode }) => {
  const [recentItems, setRecentItems] = useState<RecentItemType[]>([]);

  // Load lịch sử khi mở app
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const json = await AsyncStorage.getItem('user_history');
        if (json) {
          setRecentItems(JSON.parse(json));
        }
      } catch (e) {
        console.error("Lỗi load history:", e);
      }
    };
    loadHistory();
  }, []);

  // Hàm thêm vào lịch sử
  const addToHistory = async (item: Omit<RecentItemType, 'time'>) => {
    const newItem: RecentItemType = {
      ...item,
      time: new Date().toISOString() // Lưu thời gian hiện tại
    };

    // Lọc bỏ item trùng (nếu đã có thì xóa cũ để đưa cái mới lên đầu)
    const filtered = recentItems.filter(i => i.id !== item.id);
    
    // Giới hạn chỉ lưu 10 cái gần nhất
    const updatedList = [newItem, ...filtered].slice(0, 10);
    
    setRecentItems(updatedList);
    await AsyncStorage.setItem('user_history', JSON.stringify(updatedList));
  };

  const clearHistory = async () => {
    setRecentItems([]);
    await AsyncStorage.removeItem('user_history');
  };

  return (
    <HistoryContext.Provider value={{ recentItems, addToHistory, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
};