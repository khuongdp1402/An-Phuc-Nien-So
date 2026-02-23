using AnPhucNienSo.Api.Data;
using AnPhucNienSo.Api.DTOs;
using AnPhucNienSo.Api.Models;
using AnPhucNienSo.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnPhucNienSo.Api.Controllers;

[ApiController]
[Route("api/prayer-records")]
public class PrayerRecordsController(AppDbContext db, LunarService lunar) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? year, [FromQuery] string? type, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Max(1, page);

        var query = db.PrayerRecords
            .Include(p => p.Family).ThenInclude(f => f.Members)
            .AsQueryable();

        if (year.HasValue)
            query = query.Where(p => p.Year == year.Value);
        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(p => p.Type == type);

        var totalCount = await query.CountAsync();

        var totalDonation = await query.SumAsync(p => p.DonationAmount ?? 0);

        var records = await query
            .OrderBy(p => p.Family.HeadOfHouseholdName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PrayerRecordDto
            {
                Id = p.Id,
                Year = p.Year,
                Type = p.Type,
                FamilyId = p.FamilyId,
                FamilyName = p.Family.HeadOfHouseholdName,
                FamilyAddress = p.Family.Address,
                FamilyPhone = p.Family.PhoneNumber,
                MemberCount = p.Family.Members.Count,
                DonationAmount = p.DonationAmount,
                Notes = p.Notes,
                CreatedAt = p.CreatedAt,
            })
            .ToListAsync();

        return Ok(new
        {
            items = records,
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize),
            totalDonation,
        });
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetYearSummaries()
    {
        var summaries = await db.PrayerRecords
            .GroupBy(p => p.Year)
            .Select(g => new PrayerYearSummaryDto
            {
                Year = g.Key,
                CauAnCount = g.Count(p => p.Type == "CauAn"),
                CauSieuCount = g.Count(p => p.Type == "CauSieu"),
                TotalCauAnDonation = g.Where(p => p.Type == "CauAn").Sum(p => p.DonationAmount ?? 0),
                TotalCauSieuDonation = g.Where(p => p.Type == "CauSieu").Sum(p => p.DonationAmount ?? 0),
            })
            .OrderByDescending(s => s.Year)
            .ToListAsync();

        return Ok(summaries);
    }

    [HttpGet("print-data")]
    public async Task<IActionResult> GetPrintData([FromQuery] int year, [FromQuery] string type, [FromQuery] Guid? recordId)
    {
        int currentYear = await GetConfiguredYear();

        var query = db.PrayerRecords
            .Include(p => p.Family).ThenInclude(f => f.Members)
            .Where(p => p.Year == year && p.Type == type);

        if (recordId.HasValue)
            query = query.Where(p => p.Id == recordId.Value);

        var records = await query
            .OrderBy(p => p.Family.HeadOfHouseholdName)
            .ToListAsync();

        var result = records.Select(r =>
        {
            var members = (r.Type == "CauAn"
                ? r.Family.Members.Where(m => m.IsAlive)
                : r.Family.Members.Where(m => !m.IsAlive))
                .OrderByDescending(m => m.BirthYear == r.Family.Members.Min(x => x.BirthYear) ? 0 : 1)
                .ThenBy(m => m.BirthYear)
                .Select(m =>
                {
                    var sh = lunar.GetSaoHan(m.BirthYear, m.Gender, currentYear);
                    return new
                    {
                        m.Name,
                        m.DharmaName,
                        m.BirthYear,
                        m.Gender,
                        sh.TuoiMu,
                        sh.Sao,
                        sh.Han,
                    };
                })
                .ToList();

            return new
            {
                r.Id,
                r.FamilyId,
                FamilyName = r.Family.HeadOfHouseholdName,
                FamilyAddress = r.Family.Address,
                r.DonationAmount,
                r.Notes,
                Members = members,
            };
        });

        return Ok(new { year, type, currentYear, items = result });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePrayerRecordRequest request)
    {
        var familyExists = await db.Families.AnyAsync(f => f.Id == request.FamilyId);
        if (!familyExists)
            return NotFound(new { error = "Không tìm thấy gia đình." });

        var duplicate = await db.PrayerRecords.AnyAsync(p =>
            p.Year == request.Year && p.Type == request.Type && p.FamilyId == request.FamilyId);
        if (duplicate)
            return Conflict(new { error = "Gia đình này đã được ghi nhận trong danh sách năm nay." });

        var record = new PrayerRecord
        {
            Year = request.Year,
            Type = request.Type,
            FamilyId = request.FamilyId,
            DonationAmount = request.DonationAmount,
            Notes = request.Notes,
        };

        db.PrayerRecords.Add(record);
        await db.SaveChangesAsync();

        var dto = await db.PrayerRecords
            .Include(p => p.Family).ThenInclude(f => f.Members)
            .Where(p => p.Id == record.Id)
            .Select(p => new PrayerRecordDto
            {
                Id = p.Id,
                Year = p.Year,
                Type = p.Type,
                FamilyId = p.FamilyId,
                FamilyName = p.Family.HeadOfHouseholdName,
                FamilyAddress = p.Family.Address,
                FamilyPhone = p.Family.PhoneNumber,
                MemberCount = p.Family.Members.Count,
                DonationAmount = p.DonationAmount,
                Notes = p.Notes,
                CreatedAt = p.CreatedAt,
            })
            .FirstAsync();

        return CreatedAtAction(nameof(GetAll), null, dto);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePrayerRecordRequest request)
    {
        var record = await db.PrayerRecords.FindAsync(id);
        if (record is null)
            return NotFound(new { error = "Không tìm thấy bản ghi." });

        record.DonationAmount = request.DonationAmount;
        record.Notes = request.Notes;

        await db.SaveChangesAsync();
        return Ok(new { id = record.Id, donationAmount = record.DonationAmount, notes = record.Notes });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var record = await db.PrayerRecords.FindAsync(id);
        if (record is null)
            return NotFound(new { error = "Không tìm thấy bản ghi." });

        db.PrayerRecords.Remove(record);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<int> GetConfiguredYear()
    {
        var cfg = await db.SystemConfigs.FindAsync(SystemConfig.KeyLunarYear);
        return cfg is not null && int.TryParse(cfg.Value, out var y) ? y : DateTime.Now.Year;
    }
}
