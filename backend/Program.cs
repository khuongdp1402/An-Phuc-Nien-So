using System.Text;
using System.Security.Claims;
using AnPhucNienSo.Api.Data;
using AnPhucNienSo.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// JWT — bắt buộc có Secret trên server (trong appsettings.json)
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secret = jwtSettings["Secret"]?.Trim();
if (string.IsNullOrEmpty(secret))
{
    throw new InvalidOperationException(
        "JwtSettings:Secret chưa cấu hình. Trên server IIS, sửa file appsettings.json trong thư mục publish, thêm hoặc kiểm tra mục JwtSettings với Secret (chuỗi bí mật đủ dài).");
}

var issuer = jwtSettings["Issuer"]?.Trim() ?? "AnPhucNienSoApi";
var audience = jwtSettings["Audience"]?.Trim() ?? "AnPhucNienSoClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = issuer,
        ValidAudience = audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
        NameClaimType = ClaimTypes.Name,
        RoleClaimType = ClaimTypes.Role
    };
});

builder.Services.AddHttpContextAccessor();

// PostgreSQL via EF Core
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Domain services
builder.Services.AddSingleton<LunarService>();
builder.Services.AddSingleton<TextParserService>();
builder.Services.AddSingleton<OcrService>();
builder.Services.AddScoped<ITenantProvider, TenantProvider>();
builder.Services.AddScoped<AuthService>();

// CORS — allow all origins (tắt giới hạn, cho phép mọi nguồn)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Auto-apply pending migrations on startup with retry logic
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var db = services.GetRequiredService<AppDbContext>();

    int retries = 5;
    while (retries > 0)
    {
        try
        {
            logger.LogInformation("Applying database migrations (Attempt {Attempt})...", 6 - retries);
            db.Database.Migrate();
            logger.LogInformation("Database migrations applied successfully.");
            break; // Success, exit loop
        }
        catch (Exception ex)
        {
            retries--;
            logger.LogError(ex, "An error occurred while migrating or seeding the database. {Retries} retries left.", retries);
            if (retries == 0) throw;
            await Task.Delay(2000); // Wait 2s before retry
        }
    }

    // Fix default admin password if DB was created with old migration (invalid BCrypt placeholder)
    const string oldPlaceholderHash = "$2a$11$9e/xP7hW.1y6GfBf4u5eQ.nBv8Z4Y6r9l8k7m6n5o4p3q2r1s0t1u";
    const string correctAdmin123Hash = "$2a$11$Phi5q1HboCHBpqmh9l75WuR58WUXPtWqNkkf06hhncEwHLKi9EP7e";
    try
    {
        var adminAccount = await db.Accounts.AsNoTracking().FirstOrDefaultAsync(a => a.Username == "admin");
        if (adminAccount?.PasswordHash == oldPlaceholderHash)
        {
            var toUpdate = await db.Accounts.FirstOrDefaultAsync(a => a.Username == "admin");
            if (toUpdate != null)
            {
                toUpdate.PasswordHash = correctAdmin123Hash;
                await db.SaveChangesAsync();
                logger.LogInformation("Default admin password has been fixed (admin / admin123).");
            }
        }
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Could not check/fix default admin password.");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
