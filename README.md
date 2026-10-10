# 🚀 WEBSITE BÁN TÀI KHOẢN SỐ & BẢN QUYỀN 24/7 (PRO RESELLER EDITION)

Nền tảng thương mại điện tử chuyên biệt để bán các loại tài khoản công nghệ, streaming, đồ họa, phần mềm bản quyền, API Key, proxy và prompt AI tự động hoàn toàn, tích hợp trực tiếp với **Bot Telegram nguồn để ăn chênh lệch giá (Arbitrage / Dropship)** và cổng thanh toán **VietQR chuẩn NAPAS 24/7**.

---

## 🌟 TÍNH NĂNG NỔI BẬT

### 1. Danh Mục Sản Phẩm Đầy Đủ Sẵn Có
- **AI & Trí Tuệ Nhân Tạo**: Google AI Pro (Gemini Advanced 2TB), ChatGPT Plus (GPT-4o), Claude Pro, Cursor AI, Midjourney.
- **Giải Trí & Phim Ảnh**: Netflix Premium 4K UHD (Profile riêng có PIN), Spotify Premium, YouTube Premium.
- **Đồ Họa & Sáng Tạo**: Canva Pro (Life/Team), Adobe Creative Cloud trọn bộ 80+ apps, CapCut Pro.
- **Bản Quyền OS & Office**: Key Windows 10/11 Pro vĩnh viễn, Microsoft 365 (5 thiết bị + 1TB OneDrive), Key Office 2021/2024.
- **API Key & Prompt AI**: OpenAI API Key, Gemini Pro API, Kho 5.000+ Prompt độc quyền Midjourney/Marketing.
- **Mạng, VPN & Proxy**: NordVPN, Surfshark, Proxy IPv4 Datacenter/Dân cư sạch.
- **MXH & Tiện Ích**: Locket Gold chính chủ, Notion Plus + AI, Via/Clone Facebook.

### 2. Mô Hình Kết Nối Bot Telegram Bán Chênh Lệch Giá (Dropship Reselling)
- Tự động chuyển lệnh mua sang Bot Telegram nguồn (`@BotSupplier`) khi khách thanh toán trên web.
- Hệ thống trích xuất thông tin tài khoản từ tin nhắn bot nhả về và hiển thị ngay trên màn hình web cho khách trong vòng 3-5 giây.
- **Lợi nhuận ròng**: Bạn thu tiền giá bán lẻ từ khách, bot nguồn trừ giá sỉ, bạn giữ trọn khoản chênh lệch mà không cần ôm hàng trước.
- Hỗ trợ bán song song: mặt hàng có sẵn thì xuất từ **Kho nội bộ**, mặt hàng nào muốn nhập từ bot thì cấu hình **Auto Telegram Bot**.

### 3. Hệ Thống Thanh Toán & Ví Tiền Thông Minh
- **Quét mã VietQR động**: Khách mở app ngân hàng hoặc Momo quét mã QR chuyển khoản, hệ thống nhận diện theo mã đơn hàng `DHxxxxxx`.
- **Hệ thống ví tiền (Wallet)**: Khách hàng có thể nạp tiền trước vào ví qua VietQR và mua tài khoản tức thì chỉ với 1 cú click.

### 4. Giao Diện Cao Cấp (High-End Tech UI/UX)
- Chuyển đổi linh hoạt giữa **Dark Mode (công nghệ, cyberpunk, viền phát sáng)** và **Light Mode (tối giản, sắc nét)**.
- Tìm kiếm tức thì theo từ khóa, lọc theo danh mục, hiển thị huy hiệu HOT/Giảm giá/Bán chạy.
- Hộp nhận tài khoản sau mua với nút **"Sao chép 1 chạm"** tiện lợi.

### 5. Bảng Quản Trị Hệ Thống (Admin Dashboard)
- Thống kê doanh thu, số đơn hàng hoàn tất, tồn kho.
- **Báo cáo Lãi ròng từ Bot Telegram**: Đo lường chính xác số tiền lời từ các đơn hàng liên kết Telegram Bot.
- **Nhập kho hàng loạt (Bulk Stock Import)**: Dán hàng trăm tài khoản/key vào textarea để nhập kho trong 1 giây.
- **Cấu hình thông báo Telegram**: Nhận thông báo "ting ting" về điện thoại của chủ shop mỗi khi có khách mua hàng.

---

## 🛠️ HƯỚNG DẪN CÀI ĐẶT & CHẠY DỰ ÁN

### 1. Cài đặt thư viện
```bash
npm install
```

### 2. Cấu hình file `.env`
Mở file `.env` để cập nhật thông tin tài khoản ngân hàng nhận tiền VietQR:
```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_NAME="SHOP TÀI KHOẢN SỐ 24/7"
NEXT_PUBLIC_APP_URL="http://localhost:3001"

# Ngân hàng nhận thanh toán (MB, VCB, TCB, VPB, ICB, ACB...)
VIETQR_BANK_ID="MB"
VIETQR_ACCOUNT_NO="0399999999"
VIETQR_ACCOUNT_NAME="NGUYEN VAN VUONG"
```

### 3. Đồng bộ cơ sở dữ liệu & Nạp dữ liệu mẫu (Seed Data)
```bash
npx prisma db push
node prisma/seed.mjs
```

### 4. Khởi chạy dự án
- Chế độ phát triển (Development):
  ```bash
  npm run dev
  ```
- Chế độ thương mại (Production):
  ```bash
  npm run build
  npm run start -- -p 3001
  ```

---

## 📱 CÁCH TRUY CẬP CÁC TRANG CHỨC NĂNG

| Trang | Đường dẫn | Chức năng |
| :--- | :--- | :--- |
| **Cửa Hàng (Storefront)** | `http://localhost:3001/` | Trang chủ duyệt sản phẩm, mua hàng, nạp tiền ví, đổi Dark/Light mode |
| **Tra Cứu Đơn Hàng** | `http://localhost:3001/orders` | Nhập mã đơn (VD: `DH574400`) để lấy lại tài khoản và yêu cầu bảo hành |
| **Bảng Quản Trị (Admin)** | `http://localhost:3001/admin` | Thống kê doanh thu, lãi bot telegram, nhập kho hàng loạt, cài đặt bot |

---

## 🤖 HƯỚNG DẪN CẤU HÌNH BOT TELEGRAM

1. **Nhận thông báo ting ting khi có đơn hàng**:
   - Mở Telegram, chat với `@BotFather` -> Gõ `/newbot` để tạo 1 bot mới -> Lấy mã **Bot Token**.
   - Chat với `@userinfobot` trên Telegram để lấy **Chat ID** cá nhân của bạn.
   - Vào trang Admin `http://localhost:3001/admin` -> chọn tab **Cài Đặt Bot & Thông Báo** -> dán Bot Token và Chat ID vào và bấm Lưu.

2. **Cấu hình giá vốn & Lệnh mua sang Bot nguồn**:
   - Vào tab **Mô Hình Bot Telegram Sỉ** trong trang Admin.
   - Mỗi gói sản phẩm có thể đặt: Username bot nguồn (vd: `@SupplierAccBot`), câu lệnh mua (vd: `/buy netflix_1m`), và giá vốn sỉ.
   - Hệ thống tự động tính ra phần tiền lãi ròng trên từng đơn hàng cho bạn!
