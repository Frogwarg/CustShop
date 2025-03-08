using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DevAPI.Migrations
{
    /// <inheritdoc />
    public partial class jsonhashswap : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DesignHash",
                table: "Designs",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DesignHash",
                table: "Designs");
        }
    }
}
