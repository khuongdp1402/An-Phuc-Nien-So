using AnPhucNienSo.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AnPhucNienSo.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Family> Families => Set<Family>();
    public DbSet<Member> Members => Set<Member>();
    public DbSet<PrayerRecord> PrayerRecords => Set<PrayerRecord>();
    public DbSet<SystemConfig> SystemConfigs => Set<SystemConfig>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Family>(entity =>
        {
            entity.HasKey(f => f.Id);
            entity.Property(f => f.Id).HasDefaultValueSql("gen_random_uuid()");
            entity.Property(f => f.HeadOfHouseholdName).HasMaxLength(200).IsRequired();
            entity.Property(f => f.Address).HasMaxLength(500);
            entity.Property(f => f.PhoneNumber).HasMaxLength(20);
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
