using AnPhucNienSo.Api.Data;
using AnPhucNienSo.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace AnPhucNienSo.Api.Controllers;

[Authorize(Roles = "SuperAdmin")]
[ApiController]
[Route("api/[controller]")]
public class AccountsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAccounts()
    {
        var list = await db.Accounts
            .Include(a => a.Temple)
            .OrderBy(a => a.Username)
            .Select(a => new
            {
                a.Id,
                a.Username,
                a.FullName,
                Role = a.Role.ToString(),
                a.TempleId,
                TempleName = a.Temple != null ? a.Temple.Name : null
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAccount(Guid id)
    {
        var account = await db.Accounts
            .Include(a => a.Temple)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (account == null) return NotFound();

        return Ok(new
        {
            account.Id,
            account.Username,
            account.FullName,
            Role = account.Role.ToString(),
            account.TempleId,
            TempleName = account.Temple != null ? account.Temple.Name : null
        });
    }

    [HttpPost]
    public async Task<ActionResult<Account>> PostAccount(AccountCreateDto dto)
    {
        if (await db.Accounts.AnyAsync(a => a.Username == dto.Username))
        {
            return BadRequest(new { message = "Username already exists." });
        }

        var account = new Account
        {
            Username = dto.Username,
            FullName = dto.FullName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = Enum.Parse<Role>(dto.Role),
            TempleId = dto.TempleId
        };

        db.Accounts.Add(account);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAccount), new { id = account.Id }, account);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutAccount(Guid id, AccountUpdateDto dto)
    {
        var account = await db.Accounts.FindAsync(id);
        if (account == null) return NotFound();

        account.FullName = dto.FullName;
        account.Role = Enum.Parse<Role>(dto.Role);
        account.TempleId = dto.TempleId;

        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            account.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        }

        db.Entry(account).State = EntityState.Modified;
        await db.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAccount(Guid id, [FromQuery] string currentUsername)
    {
        var account = await db.Accounts.FindAsync(id);
        if (account == null) return NotFound();

        // Safety: Don't delete the user currently logged in
        if (account.Username == User.Identity?.Name)
        {
            return BadRequest(new { message = "Cannot delete the currently logged in account." });
        }

        db.Accounts.Remove(account);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

public class AccountCreateDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = "Admin"; // "SuperAdmin" or "Admin"
    public Guid? TempleId { get; set; }
}

public class AccountUpdateDto
{
    public string? Password { get; set; } // Optional: only if changing
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = "Admin";
    public Guid? TempleId { get; set; }
}
