using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnPhucNienSo.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPrayerRecords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PrayerRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    FamilyId = table.Column<Guid>(type: "uuid", nullable: false),
                    DonationAmount = table.Column<decimal>(type: "numeric(18,0)", nullable: true),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrayerRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PrayerRecords_Families_FamilyId",
                        column: x => x.FamilyId,
                        principalTable: "Families",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PrayerRecords_FamilyId",
                table: "PrayerRecords",
                column: "FamilyId");

            migrationBuilder.CreateIndex(
                name: "IX_PrayerRecords_Year_Type_FamilyId",
                table: "PrayerRecords",
                columns: new[] { "Year", "Type", "FamilyId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PrayerRecords");
        }
    }
}
