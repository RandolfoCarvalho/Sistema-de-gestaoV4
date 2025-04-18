using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SistemaDeGestão.Migrations
{
    /// <inheritdoc />
    public partial class MigracaoAddTransactionAoPagamento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TransactionId",
                table: "Pedidos");

            migrationBuilder.AddColumn<string>(
                name: "TransactionId",
                table: "PedidoPagamento",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TransactionId",
                table: "PedidoPagamento");

            migrationBuilder.AddColumn<string>(
                name: "TransactionId",
                table: "Pedidos",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
