using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SistemaDeGestão.Migrations
{
    /// <inheritdoc />
    public partial class EnderecoDeEntregaId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pedidos_EnderecoEntrega_EnderecoEntregaId",
                table: "Pedidos");

            migrationBuilder.AlterColumn<int>(
                name: "EnderecoEntregaId",
                table: "Pedidos",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_Pedidos_EnderecoEntrega_EnderecoEntregaId",
                table: "Pedidos",
                column: "EnderecoEntregaId",
                principalTable: "EnderecoEntrega",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pedidos_EnderecoEntrega_EnderecoEntregaId",
                table: "Pedidos");

            migrationBuilder.AlterColumn<int>(
                name: "EnderecoEntregaId",
                table: "Pedidos",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Pedidos_EnderecoEntrega_EnderecoEntregaId",
                table: "Pedidos",
                column: "EnderecoEntregaId",
                principalTable: "EnderecoEntrega",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
