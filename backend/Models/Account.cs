using System;

namespace AnPhucNienSo.Api.Models;

public enum Role
{
    SuperAdmin,
    Admin
}

public class Account
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public Role Role { get; set; }
    public Guid? TempleId { get; set; }
    public Temple? Temple { get; set; }
}
