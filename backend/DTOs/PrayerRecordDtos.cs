using System.ComponentModel.DataAnnotations;

namespace AnPhucNienSo.Api.DTOs;

public class PrayerRecordDto
{
    public Guid Id { get; set; }
    public int Year { get; set; }
    public string Type { get; set; } = string.Empty;
    public Guid FamilyId { get; set; }
    public string FamilyName { get; set; } = string.Empty;
    public string? FamilyAddress { get; set; }
    public string? FamilyPhone { get; set; }
    public int MemberCount { get; set; }
    public decimal? DonationAmount { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePrayerRecordRequest
{
    [Required]
    public Guid FamilyId { get; set; }

    [Required, Range(1900, 2200)]
    public int Year { get; set; }

    [Required, RegularExpression("CauAn|CauSieu")]
    public string Type { get; set; } = string.Empty;

    public decimal? DonationAmount { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class UpdatePrayerRecordRequest
{
    public decimal? DonationAmount { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class PrayerYearSummaryDto
{
    public int Year { get; set; }
    public int CauAnCount { get; set; }
    public int CauSieuCount { get; set; }
    public decimal TotalCauAnDonation { get; set; }
    public decimal TotalCauSieuDonation { get; set; }
}

public class FamilyAutocompleteDto
{
    public Guid Id { get; set; }
    public string HeadOfHouseholdName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? PhoneNumber { get; set; }
    public int MemberCount { get; set; }
}
