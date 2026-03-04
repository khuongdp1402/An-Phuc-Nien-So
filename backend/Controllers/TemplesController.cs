using AnPhucNienSo.Api.Data;
using AnPhucNienSo.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnPhucNienSo.Api.Controllers;

[Authorize(Roles = "SuperAdmin")]
[ApiController]
[Route("api/[controller]")]
public class TemplesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetTemples()
    {
        var list = await db.Temples
            .OrderBy(t => t.Name)
            .Select(t => new
            {
                t.Id,
                t.Name,
                t.Address,
                t.PhoneNumber
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTemple(Guid id)
    {
        var temple = await db.Temples
            .Select(t => new
            {
                t.Id,
                t.Name,
                t.Address,
                t.PhoneNumber
            })
            .FirstOrDefaultAsync(t => t.Id == id);

        if (temple == null) return NotFound();
        return Ok(temple);
    }

    [HttpPost]
    public async Task<ActionResult<Temple>> PostTemple(Temple temple)
    {
        db.Temples.Add(temple);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetTemple), new { id = temple.Id }, temple);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutTemple(Guid id, Temple temple)
    {
        if (id != temple.Id) return BadRequest();
        db.Entry(temple).State = EntityState.Modified;
        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!db.Temples.Any(e => e.Id == id)) return NotFound();
            throw;
        }
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTemple(Guid id)
    {
        var temple = await db.Temples.FindAsync(id);
        if (temple == null) return NotFound();
        
        // Safety check: Don't delete temple if it has accounts or families
        if (await db.Accounts.AnyAsync(a => a.TempleId == id) || await db.Families.AnyAsync(f => f.TempleId == id))
        {
            return BadRequest(new { message = "Cannot delete temple that has associated accounts or data." });
        }

        db.Temples.Remove(temple);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
