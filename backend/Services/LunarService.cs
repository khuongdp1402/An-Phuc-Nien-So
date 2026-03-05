namespace AnPhucNienSo.Api.Services;

/// <summary>
/// Vietnamese Lunar Calendar: Cửu Diệu (9-star) and Bát Hạn (8-obstacle) calculations.
/// Based on "Bảng tính Sao Hạn nam nữ hàng năm".
/// </summary>
public class LunarService
{
    private static readonly string[] SaoNam =
    [
        "La Hầu",     // 0
        "Thổ Tú",     // 1
        "Thủy Diệu",  // 2
        "Thái Bạch",   // 3
        "Thái Dương",  // 4
        "Vân Hớn",     // 5
        "Kế Đô",      // 6
        "Thái Âm",     // 7
        "Mộc Đức"     // 8
    ];

    private static readonly string[] SaoNu =
    [
        "Kế Đô",      // 0
        "Vân Hớn",     // 1
        "Mộc Đức",    // 2
        "Thái Âm",     // 3
        "Thổ Tú",     // 4
        "La Hầu",      // 5
        "Thái Dương",  // 6
        "Thái Bạch",   // 7
        "Thủy Diệu"   // 8
    ];

    private static readonly string[] HanNam =
    [
        "Huỳnh Tuyền", // 0
        "Tam Kheo",     // 1
        "Ngũ Mộ",      // 2
        "Thiên Tinh",   // 3
        "Tán Tận",      // 4
        "Thiên La",     // 5
        "Địa Võng",     // 6
        "Diêm Vương"   // 7
    ];

    private static readonly string[] HanNu =
    [
        "Tán Tận",      // 0
        "Thiên Tinh",   // 1
        "Ngũ Mộ",      // 2
        "Tam Kheo",     // 3
        "Huỳnh Tuyền", // 4
        "Diêm Vương",  // 5
        "Địa Võng",     // 6
        "Thiên La"      // 7
    ];

    public SaoHanResult GetSaoHan(int birthYear, bool isMale, int? currentYear = null, bool forStorage = false)
    {
        int year = currentYear ?? DateTime.Now.Year;
        int tuoiMu = year - birthYear + 1;

        string sao = GetSao(tuoiMu, isMale, forStorage);
        string han = GetHan(tuoiMu, isMale);

        return new SaoHanResult(tuoiMu, sao, han);
    }

    /// <summary>
    /// Khi forStorage = true: vẫn tính và trả về tên sao thật cho tuổi ≤ 9 (để lưu/API trả về đúng giá trị).
    /// Khi forStorage = false: hiển thị "—" cho tuổi &lt; 10 theo quy tắc nghiệp vụ.
    /// </summary>
    private static string GetSao(int tuoiMu, bool isMale, bool forStorage = false)
    {
        if (tuoiMu <= 0) return "—";
        if (!forStorage && tuoiMu < 10) return "—"; // Hiển thị: dưới 10 tuổi không hiện sao
        var arr = isMale ? SaoNam : SaoNu;
        int index = (tuoiMu - 1) % arr.Length;
        return arr[index];
    }

    /// <summary>
    /// Tuổi mụ &lt; 10: không sao không hạn. Tuổi mụ 10: chỉ có sao, không hạn. Tuổi mụ ≥ 11: có cả sao và hạn.
    /// Tuổi mụ 11–17: direct mapping to the 8-element cycle (column 1).
    /// Tuổi mụ ≥ 18: the 8-Hạn cycle interleaves with the 9-Sao columns.
    /// </summary>
    private static string GetHan(int tuoiMu, bool isMale)
    {
        if (tuoiMu <= 10) return "—"; // 10 tuổi chỉ có sao, không có hạn; dưới 10 cũng không hạn

        var arr = isMale ? HanNam : HanNu;

        if (tuoiMu <= 17)
            return arr[tuoiMu - 10 - 1]; // tuoiMu 11 -> index 0, 12 -> 1, ...

        int col = (tuoiMu - 18) / 9 + 2;
        int pos = (tuoiMu - 18) % 9;
        int hanIndex = pos < col ? pos : pos - 1;

        return arr[hanIndex % arr.Length];
    }
}
