using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnPhucNienSo.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAuthAndMultiTenancy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "TempleId",
                table: "PrayerRecords",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "TempleId",
                table: "Members",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "TempleId",
                table: "Families",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "Temples",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    PhoneNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Temples", x => x.Id);
                });

            // FIX: Insert a default temple so we can satisfy foreign key constraints for existing data
            var defaultTempleId = Guid.NewGuid();
            migrationBuilder.InsertData(
                table: "Temples",
                columns: new[] { "Id", "Name", "Address", "PhoneNumber" },
                values: new object[] { defaultTempleId, "Chùa Mẫu", "Trụ sở chính", "0123456789" });

            // FIX: Update existing records to point to the new default temple
            migrationBuilder.Sql($"UPDATE \"Families\" SET \"TempleId\" = '{defaultTempleId}'");
            migrationBuilder.Sql($"UPDATE \"Members\" SET \"TempleId\" = '{defaultTempleId}'");
            migrationBuilder.Sql($"UPDATE \"PrayerRecords\" SET \"TempleId\" = '{defaultTempleId}'");

            migrationBuilder.CreateTable(
                name: "Accounts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "gen_random_uuid()"),
                    Username = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    FullName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    TempleId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Accounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Accounts_Temples_TempleId",
                        column: x => x.TempleId,
                        principalTable: "Temples",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PrayerRecords_TempleId",
                table: "PrayerRecords",
                column: "TempleId");

            migrationBuilder.CreateIndex(
                name: "IX_Members_TempleId",
                table: "Members",
                column: "TempleId");

            migrationBuilder.CreateIndex(
                name: "IX_Families_TempleId",
                table: "Families",
                column: "TempleId");

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_TempleId",
                table: "Accounts",
                column: "TempleId");

            migrationBuilder.CreateIndex(
                name: "IX_Accounts_Username",
                table: "Accounts",
                column: "Username",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Families_Temples_TempleId",
                table: "Families",
                column: "TempleId",
                principalTable: "Temples",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Members_Temples_TempleId",
                table: "Members",
                column: "TempleId",
                principalTable: "Temples",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PrayerRecords_Temples_TempleId",
                table: "PrayerRecords",
                column: "TempleId",
                principalTable: "Temples",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Families_Temples_TempleId",
                table: "Families");

            migrationBuilder.DropForeignKey(
                name: "FK_Members_Temples_TempleId",
                table: "Members");

            migrationBuilder.DropForeignKey(
                name: "FK_PrayerRecords_Temples_TempleId",
                table: "PrayerRecords");

            migrationBuilder.DropTable(
                name: "Accounts");

            migrationBuilder.DropTable(
                name: "Temples");

            migrationBuilder.DropIndex(
                name: "IX_PrayerRecords_TempleId",
                table: "PrayerRecords");

            migrationBuilder.DropIndex(
                name: "IX_Members_TempleId",
                table: "Members");

            migrationBuilder.DropIndex(
                name: "IX_Families_TempleId",
                table: "Families");

            migrationBuilder.DropColumn(
                name: "TempleId",
                table: "PrayerRecords");

            migrationBuilder.DropColumn(
                name: "TempleId",
                table: "Members");

            migrationBuilder.DropColumn(
                name: "TempleId",
                table: "Families");
        }
    }
}
