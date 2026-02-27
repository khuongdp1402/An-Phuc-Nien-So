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

    public SaoHanResult GetSaoHan(int birthYear, bool isMale, int? currentYear = null)
    {
        int year = currentYear ?? DateTime.Now.Year;
        int tuoiMu = year - birthYear + 1;

        string sao = GetSao(tuoiMu, isMale);
        string han = GetHan(tuoiMu, isMale);

        return new SaoHanResult(tuoiMu, sao, han);
    }

    private static string GetSao(int tuoiMu, bool isMale)
    {
        if (tuoiMu <= 0) return "—";
        var arr = isMale ? SaoNam : SaoNu;
        int index = (tuoiMu - 1) % arr.Length;
        return arr[index];
    }

    /// <summary>
    /// Tuổi mụ 1–9: Bình An (no obstacle).
    /// Tuổi mụ 10–17: direct mapping to the 8-element cycle (column 1).
    /// Tuổi mụ ≥ 18: the 8-Hạn cycle interleaves with the 9-Sao columns,
    /// producing one "doubled" hạn per column that shifts diagonally.
    /// </summary>
    private static string GetHan(int tuoiMu, bool isMale)
    {
        if (tuoiMu < 10) return "—";

        var arr = isMale ? HanNam : HanNu;

        if (tuoiMu <= 17)
            return arr[tuoiMu - 10];

        int col = (tuoiMu - 18) / 9 + 2;
        int pos = (tuoiMu - 18) % 9;
        int hanIndex = pos < col ? pos : pos - 1;

        return arr[hanIndex % arr.Length];
    }
}
