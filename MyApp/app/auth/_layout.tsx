import { Stack } from 'expo-router';

// Layout này áp dụng cho tất cả màn hình trong thư mục (auth), 
// đảm bảo login, signup, onboarding không có header mặc định.
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Khai báo các màn hình cụ thể trong group (auth) */}
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}