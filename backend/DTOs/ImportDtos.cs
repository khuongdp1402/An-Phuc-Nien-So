namespace AnPhucNienSo.Api.DTOs;

public class ParsedMemberDto
{
    public string? Name { get; set; }
    public int? BirthYear { get; set; }
    public bool? Gender { get; set; }
    public string? DharmaName { get; set; }
    public bool IsAlive { get; set; } = true;
}

public class ProcessTextRequest
{
    public string Text { get; set; } = string.Empty;
}

public class ImportResponse
{
    public string? ExtractedText { get; set; }
    public string? HeadOfHouseholdName { get; set; }
    public string? Address { get; set; }
    public List<ParsedMemberDto> Members { get; set; } = [];
}

public class SaveImportRequest
{
    public Guid? FamilyId { get; set; }
    public string? HeadOfHouseholdName { get; set; }
    public string? Address { get; set; }
    public string? PhoneNumber { get; set; }
    public List<ParsedMemberDto> Members { get; set; } = [];
}
