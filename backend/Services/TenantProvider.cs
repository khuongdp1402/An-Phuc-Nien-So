using System;
using Microsoft.AspNetCore.Http;

namespace AnPhucNienSo.Api.Services;

public interface ITenantProvider
{
    Guid? TempleId { get; }
    bool IsSuperAdmin { get; }
}

public class TenantProvider(IHttpContextAccessor httpContextAccessor) : ITenantProvider
{
    public Guid? TempleId
    {
        get
        {
            var claim = httpContextAccessor.HttpContext?.User?.FindFirst("TempleId")?.Value;
            if (Guid.TryParse(claim, out var templeId))
            {
                return templeId;
            }
            return null;
        }
    }

    public bool IsSuperAdmin => httpContextAccessor.HttpContext?.User?.IsInRole("SuperAdmin") ?? false;
}
