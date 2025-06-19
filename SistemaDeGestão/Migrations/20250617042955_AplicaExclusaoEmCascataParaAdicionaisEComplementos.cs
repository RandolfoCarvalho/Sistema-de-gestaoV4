using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SistemaDeGestao.Migrations
{
    /// <inheritdoc />
    public partial class AplicaExclusaoEmCascataParaAdicionaisEComplementos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Adicionais_GrupoAdicionais_GrupoAdicionalId",
                table: "Adicionais");

            migrationBuilder.DropForeignKey(
                name: "FK_Complementos_GrupoComplementos_GrupoComplementoId",
                table: "Complementos");

            migrationBuilder.DropForeignKey(
                name: "FK_ProdutoAdicionais_Adicionais_AdicionalId",
                table: "ProdutoAdicionais");

            migrationBuilder.DropForeignKey(
                name: "FK_ProdutoComplementos_Complementos_ComplementoId",
                table: "ProdutoComplementos");

            migrationBuilder.DropForeignKey(
                name: "FK_ProdutoGrupoAdicional_GrupoAdicionais_GrupoAdicionalId",
                table: "ProdutoGrupoAdicional");

            migrationBuilder.DropForeignKey(
                name: "FK_ProdutosGruposComplementos_GrupoComplementos_GrupoComplement~",
                table: "ProdutosGruposComplementos");

            migrationBuilder.AddForeignKey(
                name: "FK_Adicionais_GrupoAdicionais_GrupoAdicionalId",
                table: "Adicionais",
                column: "GrupoAdicionalId",
                principalTable: "GrupoAdicionais",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Complementos_GrupoComplementos_GrupoComplementoId",
                table: "Complementos",
                column: "GrupoComplementoId",
                principalTable: "GrupoComplementos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ProdutoAdicionais_Adicionais_AdicionalId",
                table: "ProdutoAdicionais",
                column: "AdicionalId",
                principalTable: "Adicionais",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ProdutoComplementos_Complementos_ComplementoId",
                table: "ProdutoComplementos",
                column: "ComplementoId",
                principalTable: "Complementos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ProdutoGrupoAdicional_GrupoAdicionais_GrupoAdicionalId",
                table: "ProdutoGrupoAdicional",
                column: "GrupoAdicionalId",
                principalTable: "GrupoAdicionais",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ProdutosGruposComplementos_GrupoComplementos_GrupoComplement~",
                table: "ProdutosGruposComplementos",
                column: "GrupoComplementoId",
                principalTable: "GrupoComplementos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Adicionais_GrupoAdicionais_GrupoAdicionalId",
                table: "Adicionais");

            migrationBuilder.DropForeignKey(
                name: "FK_Complementos_GrupoComplementos_GrupoComplementoId",
                table: "Complementos");

            migrationBuilder.DropForeignKey(
                name: "FK_ProdutoAdicionais_Adicionais_AdicionalId",
                table: "ProdutoAdicionais");

            migrationBuilder.DropForeignKey(
                name: "FK_ProdutoComplementos_Complementos_ComplementoId",
                table: "ProdutoComplementos");

            migrationBuilder.DropForeignKey(
                name: "FK_ProdutoGrupoAdicional_GrupoAdicionais_GrupoAdicionalId",
                table: "ProdutoGrupoAdicional");

            migrationBuilder.DropForeignKey(
                name: "FK_ProdutosGruposComplementos_GrupoComplementos_GrupoComplement~",
                table: "ProdutosGruposComplementos");

            migrationBuilder.AddForeignKey(
                name: "FK_Adicionais_GrupoAdicionais_GrupoAdicionalId",
                table: "Adicionais",
                column: "GrupoAdicionalId",
                principalTable: "GrupoAdicionais",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Complementos_GrupoComplementos_GrupoComplementoId",
                table: "Complementos",
                column: "GrupoComplementoId",
                principalTable: "GrupoComplementos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ProdutoAdicionais_Adicionais_AdicionalId",
                table: "ProdutoAdicionais",
                column: "AdicionalId",
                principalTable: "Adicionais",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ProdutoComplementos_Complementos_ComplementoId",
                table: "ProdutoComplementos",
                column: "ComplementoId",
                principalTable: "Complementos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ProdutoGrupoAdicional_GrupoAdicionais_GrupoAdicionalId",
                table: "ProdutoGrupoAdicional",
                column: "GrupoAdicionalId",
                principalTable: "GrupoAdicionais",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ProdutosGruposComplementos_GrupoComplementos_GrupoComplement~",
                table: "ProdutosGruposComplementos",
                column: "GrupoComplementoId",
                principalTable: "GrupoComplementos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
