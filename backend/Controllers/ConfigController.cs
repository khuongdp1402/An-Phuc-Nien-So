using AnPhucNienSo.Api.Data;
using AnPhucNienSo.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnPhucNienSo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConfigController(AppDbContext db) : ControllerBase
{
    [HttpGet("lunar-year")]
    public async Task<IActionResult> GetLunarYear()
    {
        var cfg = await db.SystemConfigs.FindAsync(SystemConfig.KeyLunarYear);
        int year = cfg is not null && int.TryParse(cfg.Value, out var y) ? y : DateTime.Now.Year;
        return Ok(new { year });
    }

    [HttpPut("lunar-year")]
    public async Task<IActionResult> SetLunarYear([FromBody] SetLunarYearRequest request)
    {
        if (request.Year < 1900 || request.Year > 2100)
            return BadRequest(new { error = "Year must be between 1900 and 2100." });

        var cfg = await db.SystemConfigs.FindAsync(SystemConfig.KeyLunarYear);
        if (cfg is null)
        {
            cfg = new SystemConfig { Key = SystemConfig.KeyLunarYear, Value = request.Year.ToString() };
            db.SystemConfigs.Add(cfg);
        }
        else
        {
            cfg.Value = request.Year.ToString();
        }

        await db.SaveChangesAsync();
        return Ok(new { year = request.Year });
    }
}

public class SetLunarYearRequest
{
    public int Year { get; set; }
}
