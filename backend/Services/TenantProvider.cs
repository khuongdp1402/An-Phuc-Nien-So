using System;
using Microsoft.AspNetCore.Http;

namespace AnPhucNienSo.Api.Services;

public interface ITenantProvider
{
    Guid? TempleId { get; }
    bool IsSuperAdmin { get; }
    /// <summary>True when SuperAdmin is viewing data scoped to a specific temple (X-View-Temple-Id header).</summary>
    bool ViewingAsTemple { get; }
}

public class TenantProvider(IHttpContextAccessor httpContextAccessor) : ITenantProvider
{
    private static string? GetViewTempleIdFromRequest(HttpContext? context)
    {
        if (context?.Request?.Headers is not { } headers) return null;
        var viewId = headers["X-View-Temple-Id"].FirstOrDefault()
                     ?? headers["x-view-temple-id"].FirstOrDefault();
        return string.IsNullOrWhiteSpace(viewId) ? null : viewId.Trim();
    }

    public Guid? TempleId
    {
        get
        {
            if (IsSuperAdmin)
            {
                var viewId = GetViewTempleIdFromRequest(httpContextAccessor.HttpContext);
                if (!string.IsNullOrEmpty(viewId) && Guid.TryParse(viewId, out var tid))
                    return tid;
            }
            var claim = httpContextAccessor.HttpContext?.User?.FindFirst("TempleId")?.Value;
            if (Guid.TryParse(claim, out var templeId))
                return templeId;
            return null;
        }
    }

    public bool IsSuperAdmin => httpContextAccessor.HttpContext?.User?.IsInRole("SuperAdmin") ?? false;

    public bool ViewingAsTemple
    {
        get
        {
            if (!IsSuperAdmin) return false;
            var viewId = GetViewTempleIdFromRequest(httpContextAccessor.HttpContext);
            return !string.IsNullOrEmpty(viewId) && Guid.TryParse(viewId, out _);
        }
    }
}
