import React, { FC, useState } from 'react';
import { 
    StyleSheet, 
    View, 
    Text, 
    TouchableOpacity, 
    FlatList,
    Dimensions,
    Alert,
    SafeAreaView,
    Image
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext'; 
import { useRouter } from 'expo-router';


const { width } = Dimensions.get('window');




const WelcomeIllustration = require('../assets/images/illus1.png');
const UploadIllustration = require('../assets/images/illus2.png');
const SearchIllustration = require('../assets/images/illus3.png');
const RateIllustration = require('../assets/images/illus4.png');
const LogoIllustration = require('../assets/images/illus5.png');







// Dữ liệu giả định cho 5 màn hình
const ONBOARDING_PAGES = [
    { 
        key: '1', 
        image: WelcomeIllustration, // Thêm đường dẫn hình
        title: 'Chào mừng đến với BKsharing', 
        detail: 'Nơi bạn và mọi người chia sẻ các tài liệu học tập cùng nhau dễ hơn bao giờ hết.', 
        buttonText: 'Tiếp tục' 
    },
    { 
        key: '2', 
        image: UploadIllustration,
        title: 'Tải về các liệu học tập', 
        detail: 'Dễ dàng tải file PDF, DOCX và truy cập chúng mọi lúc mọi nơi.',
        buttonText: 'Tiếp tục',
        customImageStyle: { 
            height: width * 0.8, // Giảm chiều cao xuống còn 60% chiều rộng màn hình
            width: width * 1,   // Giảm chiều rộng để hình trông cân đối hơn
            marginTop: 50,      // Tăng khoảng cách trên cùng để cân bằng
        }
    },
    { 
        key: '3', 
        image: SearchIllustration,
        title: 'Tìm tài liệu bạn cần thật nhanh', 
        detail: 'Sử dụng bộ lọc khoa học và từ khóa để tìm kiếm chính xác.',
        buttonText: 'Tiếp tục'
    },
    { 
        key: '4', 
        image: RateIllustration,
        title: 'Đánh giá độ hữu ích của tài liệu', 
        detail: 'Hệ thống đánh giá tài liệu đảm bảo, giúp bạn chọn tài liệu được đánh giá cao để tham khảo.',
        buttonText: 'Tiếp tục'
    },
    { 
        key: '5', 
        image: LogoIllustration, // Hoặc logo BK
        title: 'Bắt đầu hành trình học tập của bạn ngay nào!', 
        detail: 'Welcom!!!!!', 
        buttonText: 'Bắt đầu ngay' 
    },
];

// --- COMPONENT CHÍNH ---

export default function OnboardingScreen() {
    const { completeOnboarding } = useAuth(); // ✅ Hàm để đánh dấu hoàn thành
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = React.useRef<FlatList>(null);
    
    // Hàm xử lý khi người dùng hoàn tất (ở trang cuối cùng)
    const handleDone = async () => {
        // Gọi hàm từ AuthContext để lưu trạng thái đã xem
        await completeOnboarding(); 
        // Logic điều hướng tiếp theo sẽ do index.tsx xử lý (chuyển sang màn hình Đăng nhập)
        router.replace('/');
    };
    
    // Cuộn đến trang tiếp theo
    const scrollToNext = () => {
        if (currentIndex < ONBOARDING_PAGES.length - 1) {
            const nextIndex = currentIndex + 1;
            flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
            setCurrentIndex(nextIndex);
        } else {
            // Đã đến trang cuối, chuyển sang màn hình Đăng nhập
            handleDone();
        }
    };

    // Hàm render mỗi trang
    const renderItem = ({ item, index }: { item: typeof ONBOARDING_PAGES[0] & { customImageStyle?: object }, index: number }) => {
        const isLastPage = index === ONBOARDING_PAGES.length - 1;
        
        // Tùy chỉnh nội dung nút bấm cho trang cuối
        const buttonAction = isLastPage ? handleDone : scrollToNext;
        const iconName = isLastPage ? 'log-in-outline' : 'arrow-forward-outline'; // Icon cho trang cuối
        
        return (
            <View style={styles.pageContainer}>
                
                {/* Hình minh họa */}
                <Image 
                    source={item.image} 
                    style={[styles.imageIllustration, item.customImageStyle]}
                    resizeMode="contain"
                />
                
                {/* Phần Văn bản */}
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.detail}>{item.detail}</Text>
                </View>

                {/* ✅ NÚT BẤM (StepButton) */}
                <View style={styles.stepButtonContainer}>
                    <TouchableOpacity
                        style={styles.stepButton}
                        onPress={buttonAction} // Gọi hàm phù hợp
                        activeOpacity={0.8}
                    >
                        {/* Chỉ hiển thị icon Đăng nhập cho trang cuối (Hoặc không hiển thị icon nào cả) */}
                        {isLastPage && (
                            <Ionicons name={iconName as any} size={20} color="white" style={{ marginRight: 10 }} />
                        )}
                        <Text style={styles.stepButtonText}>
                            {item.buttonText}
                        </Text>
                        
                        {/* Hiển thị icon mũi tên cho các trang giữa */}
                        {!isLastPage && (
                            <Ionicons name={iconName as any} size={20} color="white" style={{ marginLeft: 10 }} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };
    
    // Cập nhật chỉ số trang khi cuộn
    const handleScroll = (event: any) => {
        const xOffset = event.nativeEvent.contentOffset.x;
        const newIndex = Math.round(xOffset / width);
        setCurrentIndex(newIndex);
    };

    return (
        <SafeAreaView style={styles.container}>
            
            {/* Nút Skip (Bỏ qua) - Chỉ hiển thị khi chưa phải trang cuối */}
            {currentIndex < ONBOARDING_PAGES.length - 1 && (
                <TouchableOpacity style={styles.skipButton} onPress={handleDone}>
                    <Text style={styles.skipText}>Bỏ qua</Text>
                </TouchableOpacity>
            )}

            {/* FlatList chứa các trang */}
            <FlatList
                ref={flatListRef}
                data={ONBOARDING_PAGES}
                renderItem={renderItem}
                keyExtractor={(item) => item.key}
                horizontal
                pagingEnabled // Quan trọng: Tự động căn trang
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            />
            
            <View style={styles.footer}>
                {/* Dots Indicator */}
                <View style={styles.dotsContainer}>
                    {ONBOARDING_PAGES.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                { backgroundColor: index === currentIndex ? PRIMARY_COLOR : '#ccc' },
                            ]}
                        />
                    ))}
                </View>
                
            </View>
            
        </SafeAreaView>
    );
}

// --- STYLES ---
const PRIMARY_COLOR = '#000080'; // Màu xanh đậm
const FONT_TITLE_COLOR = '#000080';
const FONT_DETAIL_COLOR = '#666';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    // --- 1. Skip Button ---
    skipButton: {
        position: 'absolute',
        top: 60,
        left: 20, // Đặt ở góc trên bên trái
        zIndex: 10,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ccc', // Viền xám nhạt
        backgroundColor: '#fff',
    },
    skipText: {
        color: FONT_DETAIL_COLOR,
        fontWeight: '500',
        fontSize: 16,
    },
    // --- 2. Page Container & Content ---
    pageContainer: {
        width: width, 
        paddingHorizontal: 30,
        // Căn chỉnh nội dung để hình ở trên, text ở dưới cùng
        paddingTop: 80,
    },
    imageIllustration: {
        // Điều chỉnh kích thước hình ảnh để chiếm phần trên của màn hình
        width: width - 60,
        height: width * 0.8, // Chiều cao bằng khoảng 80% chiều rộng
        alignSelf: 'center',
        marginBottom: 30, // Khoảng cách giữa hình và chữ
    },
    textContainer: {
        // Căn chỉnh vị trí của văn bản
        paddingTop: 20,
        paddingHorizontal: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: FONT_TITLE_COLOR,
        marginBottom: 10,
        textAlign: 'left', // Căn trái
    },
    detail: {
        fontSize: 16,
        lineHeight: 24,
        color: FONT_DETAIL_COLOR,
        textAlign: 'left', // Căn trái
    },
    // --- 3. Footer (Dots và Button) ---
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        // Chúng ta sẽ ẩn Footer cũ và thay bằng nút lớn ở mỗi trang
        // Tuy nhiên, để giữ lại Dots Indicator, ta chỉnh sửa một chút
        flexDirection: 'column',
        alignItems: 'center',
        paddingBottom: 40, // Để nút bấm không bị sát đáy
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40, // Dành chỗ cho dots
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    // Nút Tiếp tục/Hoàn thành (Được đặt trong PageContainer thay vì Footer)
    // Giữ styles cũ cho nextButton nhưng sẽ không dùng nó nữa.
    nextButton: { 
        display: 'none', 
    },
    
    // --- 4. STYLE NÚT TIẾP TỤC MỚI (Được gọi là StepButton) ---
    stepButtonContainer: {
        width: width - 60, // Bằng chiều rộng của pageContainer
        alignSelf: 'center',
        marginTop: 20, // Khoảng cách từ textContainer
        marginBottom: 40, // Khoảng cách từ đáy
    },
    stepButton: {
        backgroundColor: PRIMARY_COLOR,
        borderRadius: 15,
        paddingVertical: 18,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    stepButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 10,
    },
});