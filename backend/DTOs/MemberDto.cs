namespace AnPhucNienSo.Api.DTOs;

public class MemberDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int BirthYear { get; set; }
    public bool Gender { get; set; }
    public string? DharmaName { get; set; }
    public bool IsAlive { get; set; }
    public Guid FamilyId { get; set; }

    // Calculated on-the-fly by LunarService
    public int TuoiMu { get; set; }
    public string Sao { get; set; } = string.Empty;
    public string Han { get; set; } = string.Empty;
}
