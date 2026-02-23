namespace AnPhucNienSo.Api.DTOs;

public class DashboardSummaryDto
{
    public int CurrentYear { get; set; }
    public int FamilyCount { get; set; }
    public int TotalMembers { get; set; }
    public int CauAnCount { get; set; }
    public int CauSieuCount { get; set; }
    public decimal TotalCauAnDonation { get; set; }
    public decimal TotalCauSieuDonation { get; set; }
}

public class SaoHanStatsDto
{
    public List<DistributionItem> SaoAlive { get; set; } = [];
    public List<DistributionItem> SaoDeceased { get; set; } = [];
    public List<DistributionItem> HanAlive { get; set; } = [];
    public List<DistributionItem> HanDeceased { get; set; } = [];
    public int TotalAlive { get; set; }
    public int TotalDeceased { get; set; }
}

public class DistributionItem
{
    public string Name { get; set; } = string.Empty;
    public int Count { get; set; }
}
