namespace AnPhucNienSo.Api.Models;

public class Family
{
    public Guid Id { get; set; }
    public string HeadOfHouseholdName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? PhoneNumber { get; set; }

    public ICollection<Member> Members { get; set; } = [];
    public ICollection<PrayerRecord> PrayerRecords { get; set; } = [];
}
