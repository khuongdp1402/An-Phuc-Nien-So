namespace AnPhucNienSo.Api.Models;

/// <summary>
/// Cấu hình hệ thống lưu theo Key-Value trong DB (ví dụ: năm âm lịch hiện tại).
/// Lưu trong DB thay vì localStorage vì:
/// - Một nguồn sự thật chung: mọi user, mọi thiết bị đều dùng cùng giá trị (quan trọng cho multi-tenant).
/// - Backend cần đọc khi tạo/filter bản ghi (Cầu An, Cầu Siêu, báo cáo) — API không có localStorage.
/// - Đồng bộ: SuperAdmin đổi năm một lần, toàn hệ thống dùng năm đó; nếu lưu localStorage thì mỗi trình duyệt một kiểu, dữ liệu dễ lệch.
/// </summary>
public class SystemConfig
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;

    public const string KeyLunarYear = "CurrentLunarYear";
}
