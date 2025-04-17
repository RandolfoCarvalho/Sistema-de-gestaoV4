using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SistemaDeGestão.Migrations
{
    /// <inheritdoc />
    public partial class MudaTableNameParaEnderecosEntregas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pedidos_EnderecoEntrega_EnderecoEntregaId",
                table: "Pedidos");

            migrationBuilder.DropPrimaryKey(
                name: "PK_EnderecoEntrega",
                table: "EnderecoEntrega");

            migrationBuilder.RenameTable(
                name: "EnderecoEntrega",
                newName: "EnderecosEntregas");

            migrationBuilder.AddPrimaryKey(
                name: "PK_EnderecosEntregas",
                table: "EnderecosEntregas",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Pedidos_EnderecosEntregas_EnderecoEntregaId",
                table: "Pedidos",
                column: "EnderecoEntregaId",
                principalTable: "EnderecosEntregas",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pedidos_EnderecosEntregas_EnderecoEntregaId",
                table: "Pedidos");

            migrationBuilder.DropPrimaryKey(
                name: "PK_EnderecosEntregas",
                table: "EnderecosEntregas");

            migrationBuilder.RenameTable(
                name: "EnderecosEntregas",
                newName: "EnderecoEntrega");

            migrationBuilder.AddPrimaryKey(
                name: "PK_EnderecoEntrega",
                table: "EnderecoEntrega",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Pedidos_EnderecoEntrega_EnderecoEntregaId",
                table: "Pedidos",
                column: "EnderecoEntregaId",
                principalTable: "EnderecoEntrega",
                principalColumn: "Id");
        }
    }
}
