# 20/10 — Bí mật dành riêng cho bạn

Website chúc mừng ngày Phụ nữ Việt Nam 20/10 với giao diện huyền bí, lãng mạn, bát quái tạo từ hàng trăm hạt sáng li ti, hoa rơi, pháo hoa, phong bì, hộp quà và nhạc nền tạo bằng Web Audio API.

## Chạy website trong VS Code

1. Giải nén thư mục `20-10-secret`.
2. Mở VS Code → **File → Open Folder...** → chọn thư mục này.
3. Mở `index.html`. Có thể dùng tiện ích **Live Server** (nhấp phải `index.html` → **Open with Live Server**) hoặc mở file trực tiếp bằng Chrome/Edge.
4. Nhấn **Mở cánh cửa bí mật** để bắt đầu hành trình.

## Điều hướng kiểu nhiều trang

Nội dung được trình bày như 6 trang riêng: Cánh cửa bí mật, Lời chúc, Khu vườn, Những lá thư, Món quà và Lời nhắn khép lại. Dùng thanh điều hướng trên đầu, các chấm ở thanh dưới hoặc nút **Trước / Tiếp** để chuyển trang. Mỗi lần chuyển trang có màn hình loading khoảng 2 giây với hiệu ứng bát quái/thái cực. Có thể dùng phím mũi tên trái/phải khi không chọn vào nút hay liên kết. Màn hình loading có bát quái bằng hạt sáng li ti chuyển động, vòng sáng và thái cực ở trung tâm.

## Cấu trúc

- `index.html`: bố cục, điều hướng, loading và hộp thoại lá thư.
- `css/style.css`: giao diện, hiệu ứng, responsive và animation loading.
- `js/main.js`: điều hướng trang, lời chúc và khởi tạo giao diện.
- `js/wishes.js`: dữ liệu lời chúc, nội dung hoa và thư.
- `js/mystery.js`: mở hoa, phong bì và điều kiện mở quà.
- `js/effects.js`: cánh hoa, hạt sáng và pháo hoa.
- `js/music.js`: điều khiển phát nhạc nền MP3 (Cánh hoa phai tàn - Piano) với hiệu ứng fade in/out mượt mà.
- `js/bagua.js`: vẽ bát quái bằng các hạt sáng li ti, có hiệu ứng lấp lánh.
- `assets/`: chỗ để bổ sung hình ảnh/âm thanh riêng.

## Tính năng bổ sung

- Nút **Hiệu ứng** để bật/tắt cánh hoa và hạt sáng nền.
- Nút **⛶** để bật/tắt toàn màn hình trên máy tính.
- Nút **Gửi lời chúc này** ở trang cuối để chia sẻ bằng tính năng chia sẻ của thiết bị hoặc sao chép nội dung khi trình duyệt hỗ trợ.
- Tương thích màn hình điện thoại và máy tính; tôn trọng cài đặt giảm chuyển động của hệ điều hành.

## Tùy chỉnh nhanh

- Sửa lời chúc và thư trong `js/wishes.js`.
- Sửa màu sắc, bố cục và animation trong `css/style.css`.
- Sửa thời gian loading trong `js/main.js`: tìm `}, 2000);` và thay `2000` bằng số mili giây mong muốn.
- Website không cần cài thư viện JavaScript; Google Fonts cần kết nối Internet để tải font.
