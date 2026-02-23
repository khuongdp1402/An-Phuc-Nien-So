using System.ComponentModel.DataAnnotations;

namespace AnPhucNienSo.Api.DTOs;

public class FamilyListItemDto
{
    public Guid Id { get; set; }
    public string HeadOfHouseholdName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? PhoneNumber { get; set; }
    public int MemberCount { get; set; }
    public int AliveCount { get; set; }
    public int DeceasedCount { get; set; }
}

public class FamilyDetailDto
{
    public Guid Id { get; set; }
    public string HeadOfHouseholdName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? PhoneNumber { get; set; }
    public int Year { get; set; }
    public List<MemberDto> Members { get; set; } = [];
}

public class CreateFamilyRequest
{
    [Required, MaxLength(200)]
    public string HeadOfHouseholdName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    public List<CreateMemberRequest> Members { get; set; } = [];
}

public class UpdateFamilyRequest
{
    [Required, MaxLength(200)]
    public string HeadOfHouseholdName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }
}

public class CreateMemberRequest
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Range(1800, 2200)]
    public int BirthYear { get; set; }

    public bool Gender { get; set; } = true;

    [MaxLength(200)]
    public string? DharmaName { get; set; }

    public bool IsAlive { get; set; } = true;
}

public class UpdateMemberRequest
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Range(1800, 2200)]
    public int BirthYear { get; set; }

    public bool Gender { get; set; } = true;

    [MaxLength(200)]
    public string? DharmaName { get; set; }

    public bool IsAlive { get; set; } = true;
}
