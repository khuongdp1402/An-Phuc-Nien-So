using System.Threading.Tasks;
using AnPhucNienSo.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AnPhucNienSo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(AuthService authService) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await authService.LoginAsync(request.Username, request.Password);
        if (result == null)
        {
            return Unauthorized(new { message = "Invalid username or password" });
        }

        return Ok(new
        {
            token = result.Value.Token,
            account = new
            {
                result.Value.Account.Id,
                result.Value.Account.Username,
                result.Value.Account.FullName,
                Role = result.Value.Account.Role.ToString(),
                result.Value.Account.TempleId,
                TempleName = result.Value.Account.Temple?.Name
            }
        });
    }

    [Microsoft.AspNetCore.Authorization.Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        var success = await authService.ChangePasswordAsync(username, request.OldPassword, request.NewPassword);
        if (!success)
        {
            return BadRequest(new { message = "Mật khẩu cũ không chính xác" });
        }

        return Ok(new { message = "Đổi mật khẩu thành công" });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await authService.RegisterAsync(request.Username, request.Password, request.FullName, request.TempleName);
        if (result == null)
        {
            return BadRequest(new { message = "Tên đăng nhập đã tồn tại trong hệ thống." });
        }

        return Ok(new
        {
            token = result.Value.Token,
            account = new
            {
                result.Value.Account.Id,
                result.Value.Account.Username,
                result.Value.Account.FullName,
                Role = result.Value.Account.Role.ToString(),
                result.Value.Account.TempleId,
                TempleName = result.Value.Account.Temple?.Name
            }
        });
    }
}

public record LoginRequest(string Username, string Password);
public record ChangePasswordRequest(string OldPassword, string NewPassword);
public record RegisterRequest(string Username, string Password, string FullName, string TempleName);
