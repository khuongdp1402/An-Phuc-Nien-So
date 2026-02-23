using AnPhucNienSo.Api.Data;
using AnPhucNienSo.Api.DTOs;
using AnPhucNienSo.Api.Models;
using AnPhucNienSo.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnPhucNienSo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController(AppDbContext db, LunarService lunar) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary([FromQuery] int? year)
    {
        int configuredYear = await GetConfiguredYear();
        int filterYear = year ?? configuredYear;

        var familyCount = await db.Families.CountAsync();
        var totalMembers = await db.Members.CountAsync();

        var prayerQuery = db.PrayerRecords.Where(p => p.Year == filterYear);
        var cauAnCount = await prayerQuery.CountAsync(p => p.Type == "CauAn");
        var cauSieuCount = await prayerQuery.CountAsync(p => p.Type == "CauSieu");
        var totalCauAnDonation = await prayerQuery.Where(p => p.Type == "CauAn").SumAsync(p => p.DonationAmount ?? 0);
        var totalCauSieuDonation = await prayerQuery.Where(p => p.Type == "CauSieu").SumAsync(p => p.DonationAmount ?? 0);

        return Ok(new DashboardSummaryDto
        {
            CurrentYear = configuredYear,
            FamilyCount = familyCount,
            TotalMembers = totalMembers,
            CauAnCount = cauAnCount,
            CauSieuCount = cauSieuCount,
            TotalCauAnDonation = totalCauAnDonation,
            TotalCauSieuDonation = totalCauSieuDonation,
        });
    }

    [HttpGet("sao-han-stats")]
    public async Task<IActionResult> GetSaoHanStats()
    {
        int currentYear = await GetConfiguredYear();
        var members = await db.Members
            .Select(m => new { m.BirthYear, m.Gender, m.IsAlive })
            .ToListAsync();

        var saoAliveMap = new Dictionary<string, int>();
        var saoDeceasedMap = new Dictionary<string, int>();
        var hanAliveMap = new Dictionary<string, int>();
        var hanDeceasedMap = new Dictionary<string, int>();
        int totalAlive = 0, totalDeceased = 0;

        foreach (var m in members)
        {
            var result = lunar.GetSaoHan(m.BirthYear, m.Gender, currentYear);

            if (m.IsAlive)
            {
                totalAlive++;
                Increment(saoAliveMap, result.Sao);
                Increment(hanAliveMap, result.Han);
            }
            else
            {
                totalDeceased++;
                Increment(saoDeceasedMap, result.Sao);
                Increment(hanDeceasedMap, result.Han);
            }
        }

        return Ok(new SaoHanStatsDto
        {
            SaoAlive = ToSorted(saoAliveMap),
            SaoDeceased = ToSorted(saoDeceasedMap),
            HanAlive = ToSorted(hanAliveMap),
            HanDeceased = ToSorted(hanDeceasedMap),
            TotalAlive = totalAlive,
            TotalDeceased = totalDeceased,
        });
    }

    private async Task<int> GetConfiguredYear()
    {
        var cfg = await db.SystemConfigs.FindAsync(SystemConfig.KeyLunarYear);
        return cfg is not null && int.TryParse(cfg.Value, out var y) ? y : DateTime.Now.Year;
    }

    private static void Increment(Dictionary<string, int> map, string key)
    {
        if (!map.TryAdd(key, 1))
            map[key]++;
    }

    private static List<DistributionItem> ToSorted(Dictionary<string, int> map) =>
        map.OrderByDescending(kv => kv.Value)
           .Select(kv => new DistributionItem { Name = kv.Key, Count = kv.Value })
           .ToList();
}
