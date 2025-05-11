using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SistemaDeGestao.Migrations
{
    /// <inheritdoc />
    public partial class WhatsappBOT3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TemplateId",
                table: "ModelosMensagem",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TemplateId",
                table: "ModelosMensagem");
        }
    }
}
