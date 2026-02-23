using AnPhucNienSo.Api.Data;
using AnPhucNienSo.Api.DTOs;
using AnPhucNienSo.Api.Models;
using AnPhucNienSo.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnPhucNienSo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FamiliesController(AppDbContext db, LunarService lunarService) : ControllerBase
{
    // ── LIST ────────────────────────────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 18)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Max(1, page);

        var query = db.Families.Include(f => f.Members).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(f =>
                f.HeadOfHouseholdName.ToLower().Contains(term) ||
                (f.Address != null && f.Address.ToLower().Contains(term)) ||
                f.Members.Any(m => m.Name.ToLower().Contains(term)));
        }

        var totalCount = await query.CountAsync();

        var families = await query
            .OrderBy(f => f.HeadOfHouseholdName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => new FamilyListItemDto
            {
                Id = f.Id,
                HeadOfHouseholdName = f.HeadOfHouseholdName,
                Address = f.Address,
                PhoneNumber = f.PhoneNumber,
                MemberCount = f.Members.Count,
                AliveCount = f.Members.Count(m => m.IsAlive),
                DeceasedCount = f.Members.Count(m => !m.IsAlive)
            })
            .ToListAsync();

        return Ok(new PaginatedResult<FamilyListItemDto>
        {
            Items = families,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
        });
    }

    // ── AUTOCOMPLETE ─────────────────────────────────────────────────

    [HttpGet("autocomplete")]
    public async Task<IActionResult> Autocomplete([FromQuery] string? q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 1)
            return Ok(Array.Empty<FamilyAutocompleteDto>());

        var term = q.Trim().ToLower();

        var results = await db.Families
            .Include(f => f.Members)
            .Where(f =>
                f.HeadOfHouseholdName.ToLower().Contains(term) ||
                (f.Address != null && f.Address.ToLower().Contains(term)) ||
                (f.PhoneNumber != null && f.PhoneNumber.Contains(term)))
            .OrderBy(f => f.HeadOfHouseholdName)
            .Take(15)
            .Select(f => new FamilyAutocompleteDto
            {
                Id = f.Id,
                HeadOfHouseholdName = f.HeadOfHouseholdName,
                Address = f.Address,
                PhoneNumber = f.PhoneNumber,
                MemberCount = f.Members.Count,
            })
            .ToListAsync();

        return Ok(results);
    }

    // ── DETAIL ──────────────────────────────────────────────────────────

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetDetail(Guid id, [FromQuery] int? year)
    {
        var family = await db.Families
            .Include(f => f.Members)
            .FirstOrDefaultAsync(f => f.Id == id);

        if (family is null)
            return NotFound(new { error = "Family not found." });

        int calcYear = year ?? await GetConfiguredYear();

        return Ok(MapToDetailDto(family, calcYear));
    }

    // ── CREATE ──────────────────────────────────────────────────────────

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFamilyRequest request)
    {
        var family = new Family
        {
            HeadOfHouseholdName = request.HeadOfHouseholdName,
            Address = request.Address,
            PhoneNumber = request.PhoneNumber
        };

        foreach (var m in request.Members)
        {
            family.Members.Add(new Member
            {
                Name = m.Name,
                BirthYear = m.BirthYear,
                Gender = m.Gender,
                DharmaName = m.DharmaName,
                IsAlive = m.IsAlive
            });
        }

        db.Families.Add(family);
        await db.SaveChangesAsync();

        int calcYear = await GetConfiguredYear();
        return CreatedAtAction(nameof(GetDetail), new { id = family.Id },
            MapToDetailDto(family, calcYear));
    }

    // ── UPDATE FAMILY INFO ──────────────────────────────────────────────

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateFamilyRequest request)
    {
        var family = await db.Families.Include(f => f.Members).FirstOrDefaultAsync(f => f.Id == id);
        if (family is null)
            return NotFound(new { error = "Family not found." });

        family.HeadOfHouseholdName = request.HeadOfHouseholdName;
        family.Address = request.Address;
        family.PhoneNumber = request.PhoneNumber;

        await db.SaveChangesAsync();

        int calcYear = await GetConfiguredYear();
        return Ok(MapToDetailDto(family, calcYear));
    }

    // ── DELETE FAMILY ───────────────────────────────────────────────────

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var family = await db.Families.FindAsync(id);
        if (family is null)
            return NotFound(new { error = "Family not found." });

        db.Families.Remove(family);
        await db.SaveChangesAsync();

        return NoContent();
    }

    // ── ADD MEMBER ──────────────────────────────────────────────────────

    [HttpPost("{id:guid}/members")]
    public async Task<IActionResult> AddMember(Guid id, [FromBody] CreateMemberRequest request)
    {
        var family = await db.Families.Include(f => f.Members).FirstOrDefaultAsync(f => f.Id == id);
        if (family is null)
            return NotFound(new { error = "Family not found." });

        var member = new Member
        {
            Name = request.Name,
            BirthYear = request.BirthYear,
            Gender = request.Gender,
            DharmaName = request.DharmaName,
            IsAlive = request.IsAlive
        };

        family.Members.Add(member);
        await db.SaveChangesAsync();

        int calcYear = await GetConfiguredYear();
        var sh = lunarService.GetSaoHan(member.BirthYear, member.Gender, calcYear);

        return CreatedAtAction(nameof(GetDetail), new { id },
            MapMemberDto(member, sh));
    }

    // ── UPDATE MEMBER ───────────────────────────────────────────────────

    [HttpPut("{id:guid}/members/{memberId:guid}")]
    public async Task<IActionResult> UpdateMember(Guid id, Guid memberId, [FromBody] UpdateMemberRequest request)
    {
        var member = await db.Members.FirstOrDefaultAsync(m => m.Id == memberId && m.FamilyId == id);
        if (member is null)
            return NotFound(new { error = "Member not found." });

        member.Name = request.Name;
        member.BirthYear = request.BirthYear;
        member.Gender = request.Gender;
        member.DharmaName = request.DharmaName;
        member.IsAlive = request.IsAlive;

        await db.SaveChangesAsync();

        int calcYear = await GetConfiguredYear();
        var sh = lunarService.GetSaoHan(member.BirthYear, member.Gender, calcYear);

        return Ok(MapMemberDto(member, sh));
    }

    // ── PRAYER HISTORY FOR FAMILY ────────────────────────────────────────

    [HttpGet("{id:guid}/prayer-records")]
    public async Task<IActionResult> GetFamilyPrayerRecords(Guid id, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Max(1, page);

        var exists = await db.Families.AnyAsync(f => f.Id == id);
        if (!exists)
            return NotFound(new { error = "Family not found." });

        var query = db.PrayerRecords
            .Where(p => p.FamilyId == id)
            .OrderByDescending(p => p.Year)
            .ThenBy(p => p.Type);

        var totalCount = await query.CountAsync();

        var records = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PrayerRecordDto
            {
                Id = p.Id,
                Year = p.Year,
                Type = p.Type,
                FamilyId = p.FamilyId,
                FamilyName = string.Empty,
                DonationAmount = p.DonationAmount,
                Notes = p.Notes,
                CreatedAt = p.CreatedAt,
            })
            .ToListAsync();

        return Ok(new PaginatedResult<PrayerRecordDto>
        {
            Items = records,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
        });
    }

    // ── DELETE MEMBER ───────────────────────────────────────────────────

    [HttpDelete("{id:guid}/members/{memberId:guid}")]
    public async Task<IActionResult> DeleteMember(Guid id, Guid memberId)
    {
        var member = await db.Members.FirstOrDefaultAsync(m => m.Id == memberId && m.FamilyId == id);
        if (member is null)
            return NotFound(new { error = "Member not found." });

        db.Members.Remove(member);
        await db.SaveChangesAsync();

        return NoContent();
    }

    // ── Helpers ─────────────────────────────────────────────────────────

    private FamilyDetailDto MapToDetailDto(Family family, int calcYear)
    {
        return new FamilyDetailDto
        {
            Id = family.Id,
            HeadOfHouseholdName = family.HeadOfHouseholdName,
            Address = family.Address,
            PhoneNumber = family.PhoneNumber,
            Year = calcYear,
            Members = family.Members
                .Select(m =>
                {
                    var sh = lunarService.GetSaoHan(m.BirthYear, m.Gender, calcYear);
                    return MapMemberDto(m, sh);
                })
                .OrderBy(m => m.Name)
                .ToList()
        };
    }

    private static MemberDto MapMemberDto(Member m, SaoHanResult sh) => new()
    {
        Id = m.Id,
        Name = m.Name,
        BirthYear = m.BirthYear,
        Gender = m.Gender,
        DharmaName = m.DharmaName,
        IsAlive = m.IsAlive,
        FamilyId = m.FamilyId,
        TuoiMu = sh.TuoiMu,
        Sao = sh.Sao,
        Han = sh.Han
    };

    private async Task<int> GetConfiguredYear()
    {
        var cfg = await db.SystemConfigs.FindAsync(SystemConfig.KeyLunarYear);
        return cfg is not null && int.TryParse(cfg.Value, out var y) ? y : DateTime.Now.Year;
    }
}
