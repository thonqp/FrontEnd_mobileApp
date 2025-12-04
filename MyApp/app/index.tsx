// app/index.tsx

import { Redirect } from "expo-router";
import { useAuth } from "./context/AuthContext";

export default function Index() {
  // ✅ LẤY CẢ HAI TRẠNG THÁI
  const { isLoggedIn, hasOnboarded, isLoading } = useAuth(); 

  // Nếu AuthProvider vẫn đang tải trạng thái, đợi (tránh nhấp nháy màn hình)
  if (isLoading) {
      return null;
  }
  
  // --- LOGIC ĐIỀU HƯỚNG MỚI (ƯU TIÊN ONBOARDING) ---
  
  // 1. Nếu CHƯA hoàn thành Onboarding, chuyển đến màn hình Onboarding
  if (!hasOnboarded) {
      return <Redirect href="/auth/onboarding" />;
  }
  
  // 2. Nếu ĐÃ hoàn thành Onboarding, kiểm tra trạng thái Đăng nhập
  return isLoggedIn ? (
    <Redirect href="/(tabs)/home" /> // Đã đăng nhập, chuyển đến Home
  ) : (
    <Redirect href="/auth/login" /> // Chưa đăng nhập, chuyển đến Login
  );
}