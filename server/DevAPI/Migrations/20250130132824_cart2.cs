using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DevAPI.Migrations
{
    /// <inheritdoc />
    public partial class cart2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Designs_AspNetUsers_UserId",
                table: "Designs");

            migrationBuilder.DropColumn(
                name: "IsPublic",
                table: "Designs");

            migrationBuilder.DropColumn(
                name: "IsTemplate",
                table: "Designs");

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "Designs",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<string>(
                name: "PreviewUrl",
                table: "Designs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProductType",
                table: "Designs",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "CartItems",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddForeignKey(
                name: "FK_Designs_AspNetUsers_UserId",
                table: "Designs",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Designs_AspNetUsers_UserId",
                table: "Designs");

            migrationBuilder.DropColumn(
                name: "PreviewUrl",
                table: "Designs");

            migrationBuilder.DropColumn(
                name: "ProductType",
                table: "Designs");

            migrationBuilder.DropColumn(
                name: "Price",
                table: "CartItems");

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "Designs",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPublic",
                table: "Designs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsTemplate",
                table: "Designs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddForeignKey(
                name: "FK_Designs_AspNetUsers_UserId",
                table: "Designs",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
