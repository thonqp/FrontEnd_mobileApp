import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar, // Thêm StatusBar để điều chỉnh thanh trạng thái
} from 'react-native';
import { Feather } from '@expo/vector-icons'; // Sử dụng Feather icon
import { useRouter } from 'expo-router';


const RegisterScreen = () => {
  const router = useRouter(); 

  
  const handleHasAccountPress = () => {
    router.replace('/'); 
  };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Tiêu đề */}
      <View style={styles.header}>
        <Text style={styles.title}>Tạo tài khoản</Text>
        <Text style={styles.subtitle}>Tạo tài khoản và tham gia cộng đồng cùng chúng tôi!</Text>
      </View>

      {/* Form Đăng ký */}
      <View style={styles.form}>
        <TextInput
          style={[styles.input, styles.inputEmail]}
          placeholder="Email"
          placeholderTextColor="#a0a0a0"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#a0a0a0"
          secureTextEntry={true}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#a0a0a0"
          secureTextEntry={true}
        />
      </View>

      {/* Nút Đăng ký */}
      <View style={{ alignItems: 'center' }}> 
      <TouchableOpacity style={styles.registerButton}>
        <Text style={styles.registerButtonText}>Đăng ký</Text>
      </TouchableOpacity>
    </View>

      {/* Khu vực Footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleHasAccountPress}>
            <Text style={styles.hasAccountText}>Bạn đã có tài khoản ?</Text>
        </TouchableOpacity>
        
        <TouchableOpacity>
            <Text style={styles.continueWithText}>Or continue with</Text>
        </TouchableOpacity>

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
    paddingTop: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#000080', // Màu xanh đậm
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
  },
  form: {
    marginBottom: 30, // Tăng khoảng cách so với nút Đăng ký
    alignItems: 'center',
  },
  input: {
    height: 55,
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#f5f7ff', // Nền input màu xanh nhạt/tím nhạt
    fontSize: 16,
    borderWidth: 1, // Thêm border nhẹ
    borderColor: '#f5f7ff',
    width: '90%',
  },
  inputEmail: {
    // Input Email nổi bật
    backgroundColor: '#fff', 
    borderWidth: 1.5, // Đường viền xanh đậm
    borderColor: '#000080',
  },
  registerButton: {
    backgroundColor: '#000080', // Màu xanh đậm cho nút Đăng ký
    height: 55,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60, // Khoảng cách lớn hơn so với footer
    shadowColor: '#000080',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8, // Android shadow
    width: '94%',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
  },
  hasAccountText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 15,
  },
  continueWithText: {
    fontSize: 14,
    color: '#000080',
    marginBottom: 15,
  },
  socialIcon: {
    padding: 10,
    borderRadius: 20, 
    backgroundColor: '#f0f0f0', 
  },
});

export default RegisterScreen;