using System.Collections.Generic;

namespace AnPhucNienSo.Api.Models;

public class Temple
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;

    public ICollection<Account> Accounts { get; set; } = [];
    public ICollection<Family> Families { get; set; } = [];
}
