## Cấu Trúc Trang Landing Page
 
### **1. Tệp Chính: `app/page.tsx`**
 
**Vị trí:** `/vercel/share/v0-project/app/page.tsx`
 
**Vai trò:** Đây là tệp chính của trang landing page. Nó:
 
- Kiểm tra xem người dùng có đăng nhập không (nếu có sẽ redirect sang dashboard)
- Tạo layout chính với `min-h-screen` (chiếm toàn màn hình)
- Chứa gradient background xanh lam đại dương (từ `#111844` → `#4B5694` → `#7288AE`)
- Quản lý z-index để sắp xếp các lớp (background, effects, content)
---
 
### **2. Component: `StarField` - Hiệu ứng Sao**
 
**Tệp:** `/vercel/share/v0-project/components/star-field.tsx`
 
**Vai trò:**
 
- Vẽ các ngôi sao động trên canvas
- Tạo hiệu ứng "nhấp nháy" (twinkle) bằng cách thay đổi opacity
- Sao chuyển động nhẹ nhàng từ dưới lên
- Sử dụng Canvas API để vẽ trực tiếp, hiệu suất tốt hơn
- Có z-index `z-10` để hiển thị phía trên gradient
---
 
### **3. Component: `GeometricShapes` - Hình Học Chuyển Động**
 
**Tệp:** `/vercel/share/v0-project/components/geometric-shapes.tsx`
 
**Vai trò:**
 
- Tạo các hình học chuyển động (tam giác, hình tròn, hình chữ nhật)
- Sử dụng Framer Motion để tạo animation mượt mà
- Các hình dạng này có opacity thấp tạo hiệu ứng "nổi"
- Mỗi hình có duration animation khác nhau tạo sự đa dạng
- Có `pointer-events-none` để không chặn tương tác người dùng
---
 
### **4. Component: `AnimatedCTAButton` - Nút Call-To-Action**
 
**Tệp:** `/vercel/share/v0-project/components/animated-cta-button.tsx`
 
**Vai trò:**
 
- Nút "Start Now" chính trên hero section
- Có gradient background từ indigo → purple → pink
- Tạo hiệu ứng:
- **Scale** khi hover (phóng to 5%)
- **Glow** animation (halo sáng xung quanh nút)
- **Pulse** effect từ tâm nút ra ngoài
- **Arrow animation** di chuyển khi hover
- Sử dụng Framer Motion cho tất cả animation
---
 
### **5. Component: `AnimatedLink` - Liên Kết Hỗ Trợ**
 
**Tệp:** `/vercel/share/v0-project/components/animated-link.tsx`
 
**Vai trò:**
 
- Wrapper để bao quanh `AnimatedCTAButton`
- Sử dụng Next.js `useRouter` để điều hướng
- Thêm delay nhỏ (100ms) để animation có thời gian chạy trước khi chuyển trang
- Là component "use client" (React component interactif)
---
 
### **6. Component: `TestimonialSection` - Phần Testimonial**
 
**Tệp:** `/vercel/share/v0-project/components/testimonial-section.tsx`
 
**Vai trò:**
 
- Hiển thị phần "What we can offer"
- Chứa các card testimonial với:
- Avatar của người dùng
- Tên và vai trò
- Nội dung đánh giá
- Sử dụng `whileInView` animation từ Framer Motion (trigger khi scrolling vào view)
- Các card có glassmorphism effect (semi-transparent + backdrop blur)
---
 
### **7. Component: `EnhancedFooter` - Footer**
 
**Tệp:** `/vercel/share/v0-project/components/enhanced-footer.tsx`
 
**Vai trò:**
 
- Hiển thị phần footer cuối cùng
- Chứa logo, mô tả, và social media links
- Sử dụng màu `#EAE0CF` (be cát) cho tương phản trên nền xanh
- Có animation entrance khi scroll vào view
---
 
## Sơ Đồ Cấu Trúc
 
```plaintext
app/page.tsx (Landing Page Chính)
│
├── Gradient Background (#111844 → #4B5694 → #7288AE)
│
├── StarField Component
│   └── Canvas element vẽ các ngôi sao động
│
├── GeometricShapes Component
│   ├── Pyramid (tam giác)
│   ├── Circle 1 & 2
│   ├── Rectangle
│   └── Particles (5 hạt nhỏ)
│
├── Header
│   └── Logo "Tomorrow" (màu #EAE0CF)
│
├── Hero Section
│   ├── Decorative Frame (border + corners)
│   ├── Tiêu đề "All things are difficult..."
│   └── AnimatedLink
│       └── AnimatedCTAButton ("Start Now")
│
├── TestimonialSection
│   ├── Title & Description
│   └── Testimonial Cards (glassmorphism)
│
└── EnhancedFooter
    ├── Logo + Description
    └── Social Links
```
 
---
 
## Màu Sắc & Styling
 
| Phần Tử | Màu | Mục Đích
|-----|-----|-----
| **Gradient** | `#111844` → `#4B5694` → `#7288AE` | Nền chính (đại dương)
| **Chữ & Icon** | `#EAE0CF` | Tương phản cao (be/cát)
| **Decorative Frame** | `#EAE0CF` 40% opacity | Border nhẹ nhàng
| **CTA Button** | Indigo → Purple → Pink | Gradient nổi bật
| **Card Background** | White 15-20% + blur | Glassmorphism
