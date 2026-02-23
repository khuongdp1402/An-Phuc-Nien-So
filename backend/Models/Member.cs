namespace AnPhucNienSo.Api.Models;

public class Member
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int BirthYear { get; set; }

    /// <summary>true = Male, false = Female</summary>
    public bool Gender { get; set; }

    public string? DharmaName { get; set; }
    public bool IsAlive { get; set; } = true;

    public Guid FamilyId { get; set; }
    public Family Family { get; set; } = null!;
}
