import React, {FC, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator, //  ActivityIndicator để hiển thị trạng thái loading
  Alert,
} from 'react-native';
import { Feather,Ionicons } from '@expo/vector-icons'; // Sử dụng Feather icon, bạn có thể thay thế bằng icon khác nếu không dùng Expo
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

const LoginScreen = () => {
  const router = useRouter(); 
  const { login } = useAuth();


  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Trạng thái loading
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // Ẩn/hiện mật khẩu


  // --- HÀM XỬ LÝ ĐĂNG NHẬP ---
  const handleLogin = async () => {
    if (!account || !password) {
      Alert.alert('Lỗi đăng nhập', 'Vui lòng nhập đầy đủ Tên tài khoản và Mật khẩu.');
      return;
    }

    setIsLoading(true);
    try {
      // Trong thực tế, hàm login này sẽ gửi request lên API của bạn
      // và nhận token hoặc thông tin người dùng
      // Giả định: hàm login trả về true nếu thành công, false nếu thất bại (Sai TK/MK)
      
      const success = await login(account, password); 

      if (success) {
        // Đăng nhập thành công, AuthContext tự điều hướng hoặc
        // chúng ta điều hướng thủ công đến màn hình chính (Ví dụ: Tab Home)
        router.replace('/home'); 
      } else {
        // Xử lý khi đăng nhập thất bại (Sai TK/MK)
        Alert.alert('Đăng nhập thất bại', 'Tài khoản hoặc mật khẩu không chính xác.');
      }
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      Alert.alert('Lỗi hệ thống', 'Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };



  // Hàm xử lý khi người dùng nhấn nút "Bạn chưa có tài khoản?"
  const handleNoAccountPress = () => {

    router.push('/signup'); 
  };

  const handleGuestLogin = async () => {
      // Giả định bạn có hàm loginGuest trong AuthContext
      // router.replace('/home');
      Alert.alert('Chế độ Guest', 'Chức năng Guest chưa được triển khai.');
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Đăng nhập</Text>
        <Text style={styles.subtitle}>Chào mừng bạn trở lại !</Text>
      </View>
      <View style={styles.form}>
        <TextInput
          style={[styles.input, styles.inputAccount]}
          placeholder="account"
          placeholderTextColor="#a0a0a0"
          value={account}
          onChangeText={setAccount}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={styles.passwordInputContainer}>
          <TextInput
            style={[styles.input, {width: '100%', borderWidth: 0, marginBottom: 0}]} 
            placeholder="Mật khẩu"
            placeholderTextColor="#a0a0a0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!isPasswordVisible}
          />
          <TouchableOpacity 
              style={styles.passwordToggle} 
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
              <Ionicons 
                  name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                  size={24} 
                  color="#999" 
              />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
        </TouchableOpacity>
      </View>

      {/* Nút Đăng nhập */}
     
        <View style={{ alignItems: 'center' }}> 
        <TouchableOpacity 
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} // ✅ ÁP DỤNG STYLE DISABLED
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleNoAccountPress}>
          <Text style={styles.noAccountText}>Bạn chưa có tài khoản ?</Text>
        </TouchableOpacity>

        {/* Nút Guest */}
        <TouchableOpacity style={styles.guestButton}>
          <Text style={styles.guestButtonText}>GUEST</Text>
        </TouchableOpacity>

        <Text style={styles.continueWithText}>Or continue with</Text>

        {/* Icon Tùy chọn */}
        <TouchableOpacity style={styles.socialIcon}>
          <Feather name="user" size={30} color="#000" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ---
// Styling
// ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Nền trắng
    paddingHorizontal: 20,
    paddingTop: 50, // Thêm padding trên để bố cục đẹp hơn
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#000080', // Màu xanh đậm
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#000',
  },
  form: {
    marginBottom: 20,
    alignItems: 'center',
  },
  input: {
    height: 55,
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#f5f7ff', // Nền input màu xanh nhạt/tím nhạt
    fontSize: 16,
    borderWidth: 1, // Thêm border nhẹ cho input Password
    borderColor: '#f5f7ff',
    width: '90%',
  },
  inputAccount: {
    backgroundColor: '#fff', // Nền input Account màu trắng
    borderWidth: 1.5, // Đường viền xanh đậm
    borderColor: '#000080',
    marginBottom: 15,
  },


  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#f5f7ff', 
    borderWidth: 1, // Thêm border nhẹ
    borderColor: '#f5f7ff',
    width: '90%',
  },
  passwordToggle: {
    padding: 5,
  },

  forgotPassword: {
    alignSelf: 'flex-end',
    width: '90%',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: '#000080',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#000080', // Màu xanh đậm cho nút Đăng nhập
    height: 55,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8, // Android shadow
    width: '94%',

  },

  loginButtonDisabled: {
    opacity: 0.6,
  },


  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
  },
  noAccountText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 15,
  },
  guestButton: {
    backgroundColor: '#f5f5f5', // Nền xám nhạt
    height: 50,
    width: '50%', // Chiều rộng tương đối
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  guestButtonText: {
    color: '#555',
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueWithText: {
    fontSize: 14,
    color: '#000080',
    marginBottom: 15,
  },
  socialIcon: {
    padding: 10,
    borderRadius: 20, // Bo tròn icon
    backgroundColor: '#f0f0f0', // Nền icon
  },
});

export default LoginScreen;