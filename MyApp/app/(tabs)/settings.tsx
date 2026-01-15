import React, { FC } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  Platform
} from 'react-native';
// Sử dụng Ionicons cho các icon Cài đặt và Đăng xuất nếu chưa có SVG
import { Ionicons, Feather } from '@expo/vector-icons'; 
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';


// --- Component Tái Sử Dụng cho Tùy chọn Cài đặt ---
interface SettingOptionProps {
  // Thay thế 'string' bằng kiểu dữ liệu chính xác của Ionicons
  iconName: keyof typeof Ionicons.glyphMap; 
  label: string;
  onPress: () => void;
  isLogout?: boolean; 
  iconColor?: string;
}

const SettingOption: FC<SettingOptionProps> = ({ 
  iconName, 
  label, 
  onPress, 
  isLogout = false,
  iconColor = '#000080'
}) => {
  
  const finalIconColor = isLogout ? '#fff' : iconColor;
  
  return (
    <TouchableOpacity 
      style={[styles.optionContainer, isLogout && styles.logoutContainer]} 
      onPress={onPress}
    >
      <View style={styles.optionContent}>
        {/* Icon */}
        <Ionicons 
          name={iconName} 
          size={24} 
          color={finalIconColor} // Màu xanh cho icon, đỏ cho nút đăng xuất
          style={styles.optionIcon}
        />
        {/* Label */}
        <Text style={[styles.optionLabel, isLogout && styles.logoutLabel]}>
          {label}
        </Text>
      </View>
      {/* Mũi tên (nếu không phải nút đăng xuất) */}
      {!isLogout && (
        <Feather name="chevron-right" size={24} color="#ccc" />
      )}
    </TouchableOpacity>
  );
};

// --- Màn hình Cài đặt Chính ---

const SettingsScreen: FC = () => {
  const router = useRouter(); // <--- KHỞI TẠO ROUTER
  const { logout, resetOnboarding } = useAuth();

  // Xử lý sự kiện khi chọn Cài đặt Tài khoản
  const handleAccountSettings = () => {
    // ✅ CHUYỂN MÀN HÌNH: Dùng router.push để điều hướng tới route /screens/accountSettings
    router.push('/screens/accountSettings');
  };
  
  // Xử lý sự kiện khi chọn Cài đặt Chung
  const handleGeneralSettings = () => {
    // ✅ CHUYỂN MÀN HÌNH: Dùng router.push để điều hướng tới route /screens/generalSettings
    router.push('/screens/generalSettings');
  };

  // Xử lý sự kiện khi chọn Chính sách
  const handlePolicies = () => {
    // ✅ CHUYỂN MÀN HÌNH: Dùng router.push để điều hướng tới route /screens/policies
    router.push('/screens/policies');
  };

  const handleResetOnboarding = async () => {
        Alert.alert(
            "Xác nhận Reset",
            "Bạn có chắc muốn reset trạng thái Onboarding? Ứng dụng sẽ khởi động lại.",
            [
                { 
                    text: "Hủy", 
                    style: "cancel" 
                },
                { 
                    text: "Reset", 
                    style: "destructive", 
                    onPress: async () => {
                        await resetOnboarding();
                        // Dùng router.replace để đảm bảo quay về index.tsx
                        router.replace('/'); 
                    } 
                }
            ]
        );
  };

  const handleLogoutPress = () => {
        Alert.alert(
            "Xác nhận Đăng xuất",
            "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?",
            [
                {
                    text: "Hủy",
                    style: "cancel"
                },
                { 
                    text: "Đăng xuất", 
                    style: "destructive", // Màu đỏ cho hành động nguy hiểm
                    onPress: async () => {
                        await logout();
                        // Redirection được xử lý bởi index.tsx khi isLoggedIn thay đổi thành false
                    } 
                }
            ]
            
        );
    };




  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* <TouchableOpacity onPress={handleClose}>
          <Feather name="x" size={24} color="#000" />
        </TouchableOpacity> */}
        <Text style={styles.headerTitle}>Cài đặt</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.optionsList}>
        <SettingOption
          label="Cài đặt tài khoản"
          iconName="person-outline" // Icon người dùng
          onPress={handleAccountSettings}
          iconColor="#FF9500"
        />
        <SettingOption
          label="Cài đặt chung" 
          iconName="settings-outline" // Icon bánh răng
          onPress={handleGeneralSettings}
          iconColor="#34C759"
        />
        <SettingOption
          label="Chính sách và điều khoản"
          iconName="document-text-outline" // Icon tài liệu
          onPress={handlePolicies}
          iconColor="#007AFF"
        />
        {/* --- DEBUG/TEST OPTION --- */}
        <SettingOption
          iconName="reload-outline" // Icon làm mới
          label="[TEST] Reset Onboarding" 
          onPress={handleResetOnboarding} // ✅ Gán hàm reset
          iconColor="#AAAAAA"
        />
        <View style={styles.logoutWrapper}>
            <SettingOption
              label="Đăng xuất"
              iconName="log-out-outline" // Icon đăng xuất
              onPress={handleLogoutPress}
              isLogout={true}
            />
        </View>
      </View>
    </SafeAreaView>
  );
};

// --- STYLING ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 50 : 10,
  },
  
  // Header Style
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  
  // Options List Style
  optionsList: {
    paddingHorizontal: 20,
    paddingTop: 20,
    flex: 1, // Để nút đăng xuất có thể nằm sát đáy
  },

  // Setting Option Style
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    paddingVertical: 18,
    paddingHorizontal: 15,
    marginBottom: 15,
    minHeight: 60,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    marginRight: 15,
  },
  optionLabel: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },

  // Logout Specific Styles
  logoutWrapper: {
    // Đặt nút đăng xuất ở cuối danh sách (sử dụng flex: 1 trong optionsList)
    marginTop: 'auto', 
    marginBottom: 100, // Thêm khoảng cách để không bị thanh NavBar che mất
  },
  logoutContainer: {
    backgroundColor: '#FF4444', // Màu đỏ nổi bật
    justifyContent: 'center',
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  logoutLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default SettingsScreen;