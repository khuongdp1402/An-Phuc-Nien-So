using System;
using AnPhucNienSo.Api.Models;
using AnPhucNienSo.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace AnPhucNienSo.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options, ITenantProvider? tenantProvider = null) : DbContext(options)
{
    private readonly Guid? _currentTempleId = tenantProvider?.TempleId;
    private readonly bool _isSuperAdmin = tenantProvider?.IsSuperAdmin ?? true;
    private readonly bool _viewingAsTemple = tenantProvider?.ViewingAsTemple ?? false;

    public DbSet<Family> Families => Set<Family>();
    public DbSet<Member> Members => Set<Member>();
    public DbSet<PrayerRecord> PrayerRecords => Set<PrayerRecord>();
    public DbSet<SystemConfig> SystemConfigs => Set<SystemConfig>();
    public DbSet<Temple> Temples => Set<Temple>();
    public DbSet<Account> Accounts => Set<Account>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Temple>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(t => t.Name).HasMaxLength(255).IsRequired();
            entity.Property(t => t.Address).HasMaxLength(500);
            entity.Property(t => t.PhoneNumber).HasMaxLength(20);
        });

        modelBuilder.Entity<Account>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(a => a.Username).HasMaxLength(100).IsRequired();
            entity.HasIndex(a => a.Username).IsUnique();
            entity.Property(a => a.FullName).HasMaxLength(255);
            entity.Property(a => a.PasswordHash).IsRequired();

            entity.HasOne(a => a.Temple)
                  .WithMany(t => t.Accounts)
                  .HasForeignKey(a => a.TempleId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Family>(entity =>
        {
            entity.HasKey(f => f.Id);
            entity.Property(f => f.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(f => f.HeadOfHouseholdName).HasMaxLength(200).IsRequired();
            entity.Property(f => f.Address).HasMaxLength(500);
            entity.Property(f => f.PhoneNumber).HasMaxLength(20);

            entity.HasOne(f => f.Temple)
                  .WithMany(t => t.Families)
                  .HasForeignKey(f => f.TempleId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasQueryFilter(f => (!_viewingAsTemple && _isSuperAdmin) || f.TempleId == _currentTempleId);
        });

        modelBuilder.Entity<Member>(entity =>
        {
            entity.HasKey(m => m.Id);
            entity.Property(m => m.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(m => m.Name).HasMaxLength(200).IsRequired();
            entity.Property(m => m.DharmaName).HasMaxLength(200);

            entity.HasOne(m => m.Family)
                  .WithMany(f => f.Members)
                  .HasForeignKey(m => m.FamilyId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasQueryFilter(m => (!_viewingAsTemple && _isSuperAdmin) || m.TempleId == _currentTempleId);
        });

        modelBuilder.Entity<PrayerRecord>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(p => p.Type).HasMaxLength(20).IsRequired();
            entity.Property(p => p.DonationAmount).HasColumnType("decimal(18,0)");
            entity.Property(p => p.Notes).HasMaxLength(500);
            entity.Property(p => p.CreatedAt).HasDefaultValueSql("now()");

            entity.HasOne(p => p.Family)
                  .WithMany(f => f.PrayerRecords)
                  .HasForeignKey(p => p.FamilyId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(p => new { p.Year, p.Type, p.FamilyId }).IsUnique();

            entity.HasQueryFilter(p => (!_viewingAsTemple && _isSuperAdmin) || p.TempleId == _currentTempleId);
        });

        modelBuilder.Entity<SystemConfig>(entity =>
        {
            entity.HasKey(c => c.Key);
            entity.Property(c => c.Key).HasMaxLength(100);
            entity.Property(c => c.Value).HasMaxLength(500).IsRequired();

            entity.HasData(new SystemConfig
            {
                Key = SystemConfig.KeyLunarYear,
                Value = DateTime.Now.Year.ToString()
            });
        });
    }
}
