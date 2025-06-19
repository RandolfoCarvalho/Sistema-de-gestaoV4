using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SistemaDeGestao.Migrations
{
    /// <inheritdoc />
    public partial class AdicionaTaxaEntrega : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "TaxaEntrega",
                table: "Empresas",
                type: "decimal(10,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TaxaEntrega",
                table: "Empresas");
        }
    }
}
