import { Stack, Redirect } from "expo-router";
// ✅ SỬA LỖI 2459: Import type Href từ module chính 'expo-router'
import type { Href } from 'expo-router'; 
import { ThemeProvider } from './context/ThemeContext'; 
import { AuthProvider, useAuth } from './context/AuthContext'; 
import React from 'react';


// --- Component BỌC Logic Điều hướng ---
function RootLayoutContent() {
  // Lấy trạng thái từ AuthContext
  const { isLoggedIn, isLoading, hasOnboarded } = useAuth();

  if (isLoading) {
    // Hiển thị màn hình chờ trong khi tải trạng thái ban đầu (giả định)
    return null; 
  }

  // --- LOGIC REDIRECT: Xử lý việc chuyển hướng ---
  // Quyết định path để Redirect tới
  let redirectPath: string;

  if (!isLoggedIn) {
      if (!hasOnboarded) {
          // Chưa Onboarded -> Chuyển đến màn hình Onboarding
          redirectPath = "/(auth)/onboarding"; 
      } else {
          // Chưa đăng nhập, đã Onboarded -> Chuyển đến màn hình Login
          redirectPath = "/(auth)/login";
      }
  } else {
      // Đã đăng nhập -> Chuyển đến trang chủ trong hệ thống Tabs
      redirectPath = "/(tabs)/home";
  }

  // ✅ Ép kiểu cho đối tượng href để vượt qua lỗi TypeScript 2322 (Lỗi cũ)
  // TypeScript không thể suy luận an toàn khi có route động như details/[id]
  const redirectHref = { pathname: redirectPath } as Href;


  // --- Cấu trúc Router chính ---
  return (
    <Stack screenOptions={{ headerShown: false }}>
      
      {/* 1. UN-AUTHENTICATED GROUP (Auth) */}
      <Stack.Screen 
        name="(auth)" 
        options={{ 
          headerShown: false,
        }} 
      />
      
      {/* 2. AUTHENTICATED GROUP (Tabs) */}
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: false,
        }} 
      />
      
      {/* 3. Màn hình chi tiết nằm ở ngoài Tabs (Ví dụ: /details/123) */}
      <Stack.Screen name="details/[id]" />
      
      {/* 4. Thực hiện Redirect dựa trên logic trên */}
      <Redirect href={redirectHref} />
      
    </Stack>
  );
}


// --- Root Layout Chính (Không thay đổi) ---
export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider> 
        <RootLayoutContent />
      </ThemeProvider>
    </AuthProvider>
  );
}