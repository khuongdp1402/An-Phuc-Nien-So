namespace AnPhucNienSo.Api.Models;

public class PrayerRecord
{
    public Guid Id { get; set; }
    public int Year { get; set; }

    /// <summary>"CauAn" hoặc "CauSieu"</summary>
    public string Type { get; set; } = string.Empty;

    public Guid FamilyId { get; set; }
    public Family Family { get; set; } = null!;

    /// <summary>Số tiền cúng dường (VNĐ)</summary>
    public decimal? DonationAmount { get; set; }

    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
