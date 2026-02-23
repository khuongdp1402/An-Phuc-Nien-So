# Hướng dẫn Deploy — An Phúc Niên Sổ

## Kiến trúc triển khai

```
[Vercel]                  [Windows Server]          [PostgreSQL]
Frontend (React)  ──→     IIS + ASP.NET Core  ──→   Database
https://xxx.vercel.app    https://api.domain.com    localhost:5432
```

---

## Phần 1: Chuẩn bị Database (PostgreSQL trên Windows Server)

### 1.1 Cài đặt PostgreSQL

1. Tải PostgreSQL 15+ từ https://www.postgresql.org/download/windows/
2. Chạy installer, chọn:
   - PostgreSQL Server
   - pgAdmin 4 (công cụ quản lý DB qua web)
   - Command Line Tools
3. Đặt mật khẩu cho user `postgres` (superuser) — **ghi nhớ mật khẩu này**
4. Giữ port mặc định `5432`

### 1.2 Tạo database và user

Mở **pgAdmin 4** hoặc **psql** (command line), chạy:

```sql
-- Tạo user riêng cho ứng dụng
CREATE USER anphucnienso_admin WITH PASSWORD 'MatKhauManh@2026';

-- Tạo database
CREATE DATABASE anphucnienso OWNER anphucnienso_admin;

-- Cấp quyền đầy đủ
GRANT ALL PRIVILEGES ON DATABASE anphucnienso TO anphucnienso_admin;
```

> **Lưu ý**: Thay `MatKhauManh@2026` bằng mật khẩu mạnh, không dùng mật khẩu mẫu.

### 1.3 Cấu hình cho phép kết nối

File `pg_hba.conf` (thường ở `C:\Program Files\PostgreSQL\15\data\`):

```
# Cho phép kết nối local
host    anphucnienso    anphucnienso_admin    127.0.0.1/32    scram-sha-256
```

Restart service PostgreSQL sau khi sửa.

### 1.4 Connection string

Sau khi tạo xong, connection string sẽ là:

```
Host=localhost;Port=5432;Database=anphucnienso;Username=anphucnienso_admin;Password=MatKhauManh@2026
```

> Database table sẽ tự động được tạo khi API khởi động lần đầu (auto migration).

---

## Phần 2: Deploy API lên IIS (Windows Server)

### 2.1 Cài đặt prerequisites trên Server

1. **ASP.NET Core 8.0 Hosting Bundle** (bắt buộc):
   - Tải từ: https://dotnet.microsoft.com/download/dotnet/8.0
   - Chọn **Hosting Bundle** (không phải SDK) ở phần "ASP.NET Core Runtime"
   - Cài xong **phải restart IIS**: mở CMD admin → `iisreset`

2. **IIS** (nếu chưa bật):
   - Server Manager → Add Roles and Features → Web Server (IIS)
   - Hoặc PowerShell: `Install-WindowsFeature -name Web-Server -IncludeManagementTools`

3. **Tesseract OCR 5.x** (cho tính năng nhập ảnh):
   - Tải từ: https://github.com/UB-Mannheim/tesseract/wiki
   - Cài đặt, nhớ đường dẫn (mặc định `C:\Program Files\Tesseract-OCR`)
   - Thêm vào PATH hệ thống nếu cần

### 2.2 Publish API từ máy dev

Mở terminal tại thư mục `backend/`:

```powershell
dotnet publish -c Release -o ./publish
```

Thư mục `publish/` sẽ chứa tất cả file cần thiết bao gồm:
- `AnPhucNienSo.Api.dll`
- `web.config`
- `appsettings.json`
- `tessdata/` (chứa file nhận dạng OCR)

### 2.3 Cấu hình appsettings.json (trên server)

Sửa file `publish/appsettings.json` trước khi copy lên server:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=anphucnienso;Username=anphucnienso_admin;Password=MatKhauManh@2026"
  },
  "AllowedCorsOrigins": [
    "https://an-phuc-nien-so.vercel.app"
  ]
}
```

**Thay đổi quan trọng:**
- `DefaultConnection`: điền đúng password PostgreSQL đã tạo ở Phần 1
- `AllowedCorsOrigins`: điền đúng URL Vercel sau khi deploy frontend (Phần 3)

### 2.4 Copy lên Server

Copy toàn bộ thư mục `publish/` lên server, ví dụ:

```
C:\inetpub\AnPhucNienSo\
```

### 2.5 Tạo IIS Site

1. Mở **IIS Manager** (inetmgr)
2. **Application Pools** → Add Application Pool:
   - Name: `AnPhucNienSo`
   - .NET CLR Version: **No Managed Code** (quan trọng!)
   - Managed Pipeline Mode: Integrated
3. **Sites** → Add Website:
   - Site name: `AnPhucNienSo`
   - Application pool: `AnPhucNienSo`
   - Physical path: `C:\inetpub\AnPhucNienSo`
   - Binding:
     - Type: `http`
     - Port: `5062` (hoặc port bạn muốn)
     - Host name: để trống hoặc điền domain

4. Tạo thư mục logs: `C:\inetpub\AnPhucNienSo\logs\`

### 2.6 Cấp quyền thư mục

```powershell
# Mở PowerShell admin trên server
icacls "C:\inetpub\AnPhucNienSo" /grant "IIS_IUSRS:(OI)(CI)RX"
icacls "C:\inetpub\AnPhucNienSo\logs" /grant "IIS_IUSRS:(OI)(CI)M"
```

### 2.7 Kiểm tra

- Truy cập `http://YOUR_SERVER_IP:5062/api/dashboard/summary` trên server
- Nếu thấy JSON trả về → API hoạt động
- Nếu lỗi, kiểm tra log tại `C:\inetpub\AnPhucNienSo\logs\stdout_*.log`

### 2.8 (Tùy chọn) Cấu hình HTTPS với domain

Nếu bạn có domain (ví dụ `api.anphucnienso.com`):

1. Trỏ DNS A record của domain về IP server
2. Trong IIS → site AnPhucNienSo → Bindings → Add:
   - Type: `https`
   - Port: `443`
   - SSL Certificate: chọn certificate (có thể dùng Let's Encrypt qua win-acme)
   - Host name: `api.anphucnienso.com`
3. Cập nhật `AllowedCorsOrigins` trong `appsettings.json` nếu cần

> **Quan trọng**: Vercel frontend dùng HTTPS, nên API cũng phải HTTPS
> để tránh "Mixed Content" bị browser chặn. Nếu chưa có SSL,
> dùng Cloudflare hoặc win-acme (Let's Encrypt client cho Windows).

### 2.9 Mở Firewall

```powershell
# Mở port 5062 (hoặc 443 nếu dùng HTTPS)
New-NetFirewallRule -DisplayName "AnPhucNienSo API" -Direction Inbound -Port 5062 -Protocol TCP -Action Allow
```

---

## Phần 3: Deploy Frontend lên Vercel

### 3.1 Push code lên GitHub

Nếu chưa có repo trên GitHub:

```powershell
# Tại thư mục gốc project
git add .
git commit -m "Prepare for deployment"
git remote add origin https://github.com/YOUR_USERNAME/An-Phuc-Nien-So.git
git push -u origin main
```

### 3.2 Kết nối Vercel

1. Truy cập https://vercel.com → Sign up bằng GitHub
2. Nhấn **"Add New Project"**
3. Import repo `An-Phuc-Nien-So` từ GitHub
4. **Cấu hình quan trọng**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` ← (nhấn Edit, gõ `frontend`)
   - **Build Command**: `npm run build` (mặc định, không cần sửa)
   - **Output Directory**: `dist` (mặc định, không cần sửa)

5. **Environment Variables** — thêm biến:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://api.anphucnienso.com` (hoặc `http://YOUR_SERVER_IP:5062`) |

6. Nhấn **Deploy**

### 3.3 Cấu hình domain (tùy chọn)

- Vercel sẽ cấp domain miễn phí: `an-phuc-nien-so-xxx.vercel.app`
- Bạn có thể custom domain tại: Project Settings → Domains

### 3.4 Cập nhật CORS trên server

Sau khi biết URL Vercel chính xác, quay lại server sửa `appsettings.json`:

```json
"AllowedCorsOrigins": [
  "https://an-phuc-nien-so.vercel.app",
  "https://your-custom-domain.com"
]
```

Rồi restart site trong IIS.

### 3.5 Auto-deploy

Mỗi lần bạn push code lên GitHub branch `main`, Vercel sẽ tự động build và deploy lại.

---

## Phần 4: Checklist sau deploy

### Kiểm tra kết nối

- [ ] PostgreSQL chạy và cho phép kết nối local
- [ ] API truy cập được: `https://api.domain.com/api/dashboard/summary`
- [ ] Frontend mở được trên Vercel
- [ ] Frontend gọi API thành công (không lỗi CORS hoặc Mixed Content)

### Kiểm tra chức năng

- [ ] Đặt năm âm lịch trên Dashboard
- [ ] Thêm gia đình mới
- [ ] Nhập liệu (văn bản + OCR)
- [ ] Xem danh sách Cầu An / Cầu Siêu
- [ ] Thống kê Sao/Hạn hiển thị đúng

### Xử lý lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|----------|
| CORS error | `AllowedCorsOrigins` sai | Sửa trong `appsettings.json`, restart IIS |
| Mixed Content | API dùng HTTP, frontend dùng HTTPS | Cài SSL cho API hoặc dùng Cloudflare |
| 502.5 | Hosting Bundle chưa cài | Cài ASP.NET Core 8.0 Hosting Bundle, iisreset |
| DB connection failed | Sai connection string | Kiểm tra password, port, pg_hba.conf |
| OCR không hoạt động | Thiếu tessdata hoặc Tesseract | Kiểm tra thư mục tessdata trong publish |
| Swagger không hiện | ASPNETCORE_ENVIRONMENT=Production | Bình thường — Swagger chỉ hiện ở Development |

### Backup database

```powershell
# Trên server, chạy backup định kỳ
pg_dump -U anphucnienso_admin -d anphucnienso -F c -f "C:\backup\anphucnienso_$(Get-Date -Format 'yyyyMMdd').dump"
```

---

## Tóm tắt thứ tự thực hiện

```
1. Cài PostgreSQL trên server → tạo DB + user
2. Cài IIS + ASP.NET Core 8.0 Hosting Bundle trên server
3. dotnet publish API → copy lên server → sửa appsettings.json
4. Tạo IIS site → test API
5. Push code lên GitHub
6. Tạo project Vercel → set root = "frontend" → set VITE_API_URL
7. Deploy → lấy URL Vercel
8. Cập nhật AllowedCorsOrigins trên server → restart IIS
9. Kiểm tra toàn bộ
```
