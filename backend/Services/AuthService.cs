using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using AnPhucNienSo.Api.Data;
using AnPhucNienSo.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace AnPhucNienSo.Api.Services;

public class AuthService(AppDbContext context, IConfiguration configuration)
{
    public async Task<(string Token, Account Account)?> LoginAsync(string username, string password)
    {
        var account = await context.Accounts
            .Include(a => a.Temple)
            .FirstOrDefaultAsync(a => a.Username == username);

        if (account == null || !BCrypt.Net.BCrypt.Verify(password, account.PasswordHash))
        {
            return null;
        }

        var token = GenerateJwtToken(account);
        return (token, account);
    }

    public async Task<bool> ChangePasswordAsync(string username, string oldPassword, string newPassword)
    {
        var account = await context.Accounts.FirstOrDefaultAsync(a => a.Username == username);
        if (account == null || !BCrypt.Net.BCrypt.Verify(oldPassword, account.PasswordHash))
        {
            return false;
        }

        account.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task<(string Token, Account Account)?> RegisterAsync(string username, string password, string fullName, string templeName)
    {
        if (await context.Accounts.AnyAsync(a => a.Username == username))
        {
            return null;
        }

        // 1. Create a new temple
        var temple = new Temple
        {
            Name = templeName,
            Address = "Chưa cập nhật",
            PhoneNumber = "0000000000"
        };
        context.Temples.Add(temple);
        await context.SaveChangesAsync(); // Get the ID

        // 2. Create the admin account
        var account = new Account
        {
            Username = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            FullName = fullName,
            Role = Role.Admin,
            TempleId = temple.Id
        };
        context.Accounts.Add(account);
        await context.SaveChangesAsync();

        // Include temple for token generation if needed
        account.Temple = temple;

        var token = GenerateJwtToken(account);
        return (token, account);
    }

    private string GenerateJwtToken(Account account)
    {
        var jwtSettings = configuration.GetSection("JwtSettings");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, account.Username),
            new(ClaimTypes.Role, account.Role.ToString()),
            new("AccountId", account.Id.ToString())
        };

        if (account.TempleId.HasValue)
        {
            claims.Add(new Claim("TempleId", account.TempleId.Value.ToString()));
            claims.Add(new Claim("TempleName", account.Temple?.Name ?? ""));
        }

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.Now.AddDays(double.Parse(jwtSettings["ExpiryInDays"]!)),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
