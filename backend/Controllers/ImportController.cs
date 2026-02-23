using AnPhucNienSo.Api.Data;
using AnPhucNienSo.Api.DTOs;
using AnPhucNienSo.Api.Models;
using AnPhucNienSo.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnPhucNienSo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ImportController(
    OcrService ocrService,
    TextParserService textParserService,
    AppDbContext db) : ControllerBase
{
    /// <summary>
    /// Accepts an image file, runs Tesseract OCR, then parses the extracted text.
    /// </summary>
    [HttpPost("ocr")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Ocr(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No image file provided." });

        string extractedText;
        try
        {
            using var stream = file.OpenReadStream();
            extractedText = ocrService.ExtractText(stream);
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { error = ex.Message });
        }

        int calcYear = await GetConfiguredYear();
        var parsed = textParserService.Parse(extractedText, calcYear);

        return Ok(new ImportResponse
        {
            ExtractedText = extractedText,
            HeadOfHouseholdName = parsed.HeadOfHouseholdName,
            Address = parsed.Address,
            Members = parsed.Members
        });
    }

    /// <summary>
    /// Accepts raw text and parses it into a list of potential Member records.
    /// </summary>
    [HttpPost("process-text")]
    public async Task<IActionResult> ProcessText([FromBody] ProcessTextRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
            return BadRequest(new { error = "Text body is empty." });

        int calcYear = await GetConfiguredYear();
        var parsed = textParserService.Parse(request.Text, calcYear);

        return Ok(new ImportResponse
        {
            ExtractedText = request.Text,
            HeadOfHouseholdName = parsed.HeadOfHouseholdName,
            Address = parsed.Address,
            Members = parsed.Members
        });
    }

    /// <summary>
    /// Saves verified/corrected members. Creates a new Family when FamilyId is null.
    /// </summary>
    [HttpPost("save")]
    public async Task<IActionResult> Save([FromBody] SaveImportRequest request)
    {
        if (request.Members.Count == 0)
            return BadRequest(new { error = "No members to save." });

        Family family;

        if (request.FamilyId.HasValue && request.FamilyId.Value != Guid.Empty)
        {
            var existing = await db.Families.FindAsync(request.FamilyId.Value);
            if (existing is null)
                return NotFound(new { error = "Family not found." });
            family = existing;
        }
        else
        {
            family = new Family
            {
                HeadOfHouseholdName = request.HeadOfHouseholdName ?? request.Members[0].Name ?? "Không rõ",
                Address = request.Address,
                PhoneNumber = request.PhoneNumber
            };
            db.Families.Add(family);
        }

        foreach (var dto in request.Members)
        {
            family.Members.Add(new Member
            {
                Name = dto.Name ?? "Không rõ",
                BirthYear = dto.BirthYear ?? 0,
                Gender = dto.Gender ?? true,
                DharmaName = dto.DharmaName,
                IsAlive = dto.IsAlive,
            });
        }

        await db.SaveChangesAsync();

        return Ok(new { familyId = family.Id, memberCount = request.Members.Count });
    }

    private async Task<int> GetConfiguredYear()
    {
        var cfg = await db.SystemConfigs.FindAsync(SystemConfig.KeyLunarYear);
        return cfg is not null && int.TryParse(cfg.Value, out var y) ? y : DateTime.Now.Year;
    }
}
