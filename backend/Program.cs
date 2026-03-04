using System.Text;
using System.Security.Claims;
using AnPhucNienSo.Api.Data;
using AnPhucNienSo.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// JWT
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secret = jwtSettings["Secret"]!;
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
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
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

// CORS
var allowedOrigins = builder.Configuration
    .GetSection("AllowedCorsOrigins")
    .Get<string[]>() ?? [];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
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

            // Data Seeding
            if (!await db.Temples.AnyAsync())
            {
                logger.LogInformation("Seeding default data...");
                var defaultTemple = new AnPhucNienSo.Api.Models.Temple
                {
                    Name = "Chùa Mẫu",
                    Address = "Trụ sở chính",
                    PhoneNumber = "0123456789"
                };
                db.Temples.Add(defaultTemple);
                await db.SaveChangesAsync();

                if (!await db.Accounts.AnyAsync())
                {
                    db.Accounts.Add(new AnPhucNienSo.Api.Models.Account
                    {
                        Username = "admin",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                        FullName = "Super Admin",
                        Role = AnPhucNienSo.Api.Models.Role.SuperAdmin,
                        TempleId = defaultTemple.Id
                    });
                    await db.SaveChangesAsync();
                }
                logger.LogInformation("Default data seeded.");
            }
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
