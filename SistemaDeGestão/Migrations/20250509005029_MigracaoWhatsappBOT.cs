using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SistemaDeGestao.Migrations
{
    /// <inheritdoc />
    public partial class MigracaoWhatsappBOT : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RestauranteId",
                table: "ModelosMensagem",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RestauranteId",
                table: "ModelosMensagem");
        }
    }
}
