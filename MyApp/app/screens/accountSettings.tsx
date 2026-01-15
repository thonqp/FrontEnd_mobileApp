import React, { FC, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
  Platform
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import Services & Context
import { useAuth } from '../context/AuthContext';
import { updateBasicInfo, uploadUserAvatar, changeUserPassword } from '../services/authService';

// --- COMPONENT TÁI SỬ DỤNG: SettingOption (Giữ nguyên style cũ) ---
interface SettingOptionProps {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  iconColor: string;
  rightContent?: 'chevron' | 'switch';
  valueText?: string;
}

const SettingOption: FC<SettingOptionProps> = ({ 
    iconName, 
    label, 
    onPress, 
    iconColor, 
    rightContent = 'chevron',
    valueText,
}) => {
    const renderRightContent = () => {
        if (rightContent === 'chevron') {
            return (
                <View style={styles.valueRow}>
                    {valueText ? <Text style={styles.valueText} numberOfLines={1}>{valueText}</Text> : null}
                    <Feather name="chevron-right" size={24} color="#ccc" />
                </View>
            );
        }
        return null; 
    };

    return (
        <TouchableOpacity 
            style={styles.optionContainer} 
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.optionContent}>
                <Ionicons 
                    name={iconName} 
                    size={24} 
                    color={iconColor}
                    style={styles.optionIcon}
                />
                <Text style={styles.optionLabel}>{label}</Text>
            </View>
            {renderRightContent()}
        </TouchableOpacity>
    );
};

// --- MÀN HÌNH CHÍNH ---
export default function AccountSettingsScreen() {
    const router = useRouter();
    const { user, setUser } = useAuth(); // Lấy dữ liệu user thật từ Context

    // --- STATE CHO MODAL EDIT ---
    const [modalVisible, setModalVisible] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // State cho Đổi mật khẩu
    const [passModalVisible, setPassModalVisible] = useState(false);
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [passLoading, setPassLoading] = useState(false);


    // Điền thông tin vào Modal khi mở
    useEffect(() => {
        if (modalVisible && user) {
            setNewName(user.fullName || '');
            setNewEmail(user.email || '');
            setNewAvatarUri(null);
        }
    }, [modalVisible, user]);

    // --- LOGIC XỬ LÝ ---
    
    // 1. Chọn ảnh từ thư viện
    const handlePickAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Quyền truy cập", "Cần quyền truy cập thư viện ảnh để thay đổi avatar.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setNewAvatarUri(result.assets[0].uri);
        }
    };

    // 2. Lưu thay đổi (Logic API đã viết trước đó)
    const handleSaveChanges = async () => {
        // Kiểm tra user null ngay đầu hàm để TypeScript yên tâm
        if (!user) {
            Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng.");
            return;
        }

        if (!newName.trim() || !newEmail.trim()) {
            Alert.alert("Lỗi", "Tên và Email không được để trống.");
            return;
        }

        setLoading(true);
        try {
            let finalUser = { ...user };
            const infoChanged = newName !== user.fullName || newEmail !== user.email;

            if (infoChanged) {
                // Sử dụng toán tử ?? để cung cấp giá trị mặc định nếu null
                const updatedInfo = await updateBasicInfo({
                    userId: user.userId ?? user.id, // Ưu tiên userId, fallback sang id
                    fullName: newName,
                    email: newEmail,
                    username: user.username,
                    role: user.role || 'USER',
                    isActive: user.isActive ?? true
                });
                finalUser = { ...finalUser, ...updatedInfo };
            }

            if (newAvatarUri) {
                const uploadedImageUrl = await uploadUserAvatar(
                    user.userId ?? user.id, // Fix lỗi id
                    newAvatarUri
                );
                finalUser.profilePicture = uploadedImageUrl;
            }

            await AsyncStorage.setItem('userSession', JSON.stringify(finalUser));
            
            // Fix lỗi setUser (đã thêm vào Context ở Bước 1)
            if (setUser) setUser(finalUser);

            Alert.alert("Thành công", "Hồ sơ đã được cập nhật!");
            setModalVisible(false);

        } catch (error: any) {
            console.error(error);
            Alert.alert("Thất bại", error.message || "Có lỗi xảy ra.");
        } finally {
            setLoading(false);
        }
    };

    // --- UI handlers ---
    const handleProfilePress = () => setModalVisible(true);
    
    const handleChangePasswordPress = () => {
        setNewPass('');
        setConfirmPass('');
        setPassModalVisible(true);
    };



    const handleSavePassword = async () => {
        if (!user) return;

        // Validation
        if (!newPass || !confirmPass) {
            Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin.");
            return;
        }
        if (newPass !== confirmPass) {
            Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp.");
            return;
        }
        if (newPass.length < 6) {
             Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự.");
             return;
        }

        setPassLoading(true);
        try {
            // --- GỌI API MỚI ---
            // Không cần truyền user hiện tại nữa, chỉ cần ID và Pass mới
            await changeUserPassword({
                userId: user.userId ?? user.id,
                newPassword: newPass
            });

            Alert.alert("Thành công", "Đổi mật khẩu thành công!");
            setPassModalVisible(false);
            
            // Tùy chọn: Logout người dùng để họ đăng nhập lại với pass mới
            // logout(); 
        } catch (error: any) {
            console.error(error);
            Alert.alert("Thất bại", error.message || "Có lỗi xảy ra.");
        } finally {
            setPassLoading(false);
        }
    };

    const handleBiometricsPress = () => Alert.alert("Bảo mật", "Bật/Tắt Touch ID/Face ID.");
    const handleDeleteAccountPress = () => {
        Alert.alert(
            "Xóa Tài khoản", 
            "Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.",
            [
                { text: "Hủy", style: "cancel" },
                { text: "Xóa", style: "destructive", onPress: () => console.log('Account Deleted') }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Feather name="chevron-left" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tài khoản và Bảo mật</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.optionsList}>
                
                {/* 1. TÀI KHOẢN */}
                <Text style={styles.sectionTitle}>Tài khoản</Text>
                
                {/* Avatar Preview nhỏ ở mục Hồ sơ */}
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                     <Image 
                        source={{ uri: user?.profilePicture || 'https://via.placeholder.com/150' }} 
                        style={styles.largeAvatar}
                    />
                    <Text style={styles.userNameDisplay}>{user?.fullName || user?.username || "Chưa đăng nhập"}</Text>
                </View>

                <SettingOption 
                    iconName="person-circle-outline"
                    label="Chỉnh sửa hồ sơ"
                    iconColor="#007AFF"
                    rightContent="chevron"
                    valueText={user?.fullName}
                    onPress={handleProfilePress}
                />
                <SettingOption 
                    iconName="mail-outline"
                    label="Email"
                    iconColor="#4CD964"
                    rightContent="chevron"
                    valueText={user?.email} 
                    onPress={handleProfilePress} // Cho phép bấm vào email cũng mở modal sửa
                />

                {/* 2. BẢO MẬT */}
                <Text style={styles.sectionTitle}>Bảo mật</Text>
                <SettingOption 
                    iconName="lock-closed-outline"
                    label="Đổi mật khẩu"
                    iconColor="#FF9500"
                    onPress={handleChangePasswordPress}
                />
                <SettingOption 
                    iconName="finger-print-outline"
                    label="Touch ID/Face ID"
                    iconColor="#AF52DE"
                    onPress={handleBiometricsPress}
                />
                
                {/* 3. KHU VỰC NGUY HIỂM */}
                <Text style={styles.sectionTitle}>Khu vực nguy hiểm</Text>
                <SettingOption 
                    iconName="trash-outline"
                    label="Xóa tài khoản"
                    iconColor="#FF3B30"
                    onPress={handleDeleteAccountPress}
                />
                
            </ScrollView>

            {/* --- MODAL EDIT PROFILE --- */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Chỉnh sửa Hồ sơ</Text>

                        {/* Avatar Picker */}
                        <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarPicker}>
                            <Image 
                                source={{ uri: newAvatarUri || user?.profilePicture || 'https://via.placeholder.com/150' }} 
                                style={styles.modalAvatar} 
                            />
                            <View style={styles.cameraIcon}>
                                <Ionicons name="camera" size={18} color="#fff" />
                            </View>
                        </TouchableOpacity>

                        {/* Form Inputs */}
                        <Text style={styles.inputLabel}>Tên hiển thị</Text>
                        <TextInput 
                            style={styles.input}
                            value={newName}
                            onChangeText={setNewName}
                            placeholder="Nhập tên của bạn"
                        />

                        <Text style={styles.inputLabel}>Email</Text>
                        <TextInput 
                            style={styles.input}
                            value={newEmail}
                            onChangeText={setNewEmail}
                            placeholder="example@email.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        {/* Buttons */}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.btnCancel]} 
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.btnTextCancel}>Hủy</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.btnSave]} 
                                onPress={handleSaveChanges}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.btnTextSave}>Lưu</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>



            {/* --- MODAL CHANGE PASSWORD --- */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={passModalVisible}
                onRequestClose={() => setPassModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Đổi Mật Khẩu</Text>

                        <Text style={styles.inputLabel}>Mật khẩu mới</Text>
                        <TextInput 
                            style={styles.input}
                            value={newPass}
                            onChangeText={setNewPass}
                            placeholder="Nhập mật khẩu mới"
                            secureTextEntry={true} // Che ký tự
                        />

                        <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
                        <TextInput 
                            style={styles.input}
                            value={confirmPass}
                            onChangeText={setConfirmPass}
                            placeholder="Nhập lại mật khẩu mới"
                            secureTextEntry={true} // Che ký tự
                        />

                        {/* Buttons */}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.btnCancel]} 
                                onPress={() => setPassModalVisible(false)}
                            >
                                <Text style={styles.btnTextCancel}>Hủy</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.btnSave]} 
                                onPress={handleSavePassword}
                                disabled={passLoading}
                            >
                                {passLoading ? (
                                    <ActivityIndicator color="#fff"/>
                                ) : (
                                    <Text style={styles.btnTextSave}>Lưu</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

// --- STYLING (Merge style cũ + style mới cho Modal) ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    optionsList: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        paddingBottom: 50,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 15,
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    // Setting Option Styles
    optionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8f9fa',
        borderRadius: 15,
        paddingVertical: 15, // Giảm nhẹ padding để gọn hơn
        paddingHorizontal: 15,
        marginBottom: 10,
        minHeight: 55,
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
    valueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        maxWidth: '50%', // Giới hạn chiều rộng text giá trị
    },
    valueText: {
        fontSize: 15,
        color: '#999',
        marginRight: 5,
        flexShrink: 1, 
    },
    
    // --- Styles MỚI cho Avatar hiển thị ở Main Screen ---
    largeAvatar: {
        width: 80, 
        height: 80, 
        borderRadius: 40, 
        marginBottom: 10,
        backgroundColor: '#eee'
    },
    userNameDisplay: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },

    // --- Styles MỚI cho Modal ---
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#1A1A1A'
    },
    avatarPicker: {
        position: 'relative',
        marginBottom: 25,
    },
    modalAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f0f0f0'
    },
    cameraIcon: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        backgroundColor: '#007AFF',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff'
    },
    inputLabel: {
        alignSelf: 'flex-start',
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
        fontWeight: '600'
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#e1e1e1',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
        backgroundColor: '#fbfbfb'
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        marginTop: 10
    },
    modalBtn: {
        flex: 1,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    btnCancel: {
        backgroundColor: '#f0f0f0',
        marginRight: 10
    },
    btnSave: {
        backgroundColor: '#007AFF',
        marginLeft: 10
    },
    btnTextCancel: {
        fontWeight: '600',
        color: '#666'
    },
    btnTextSave: {
        fontWeight: 'bold',
        color: '#fff'
    },
});