using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SistemaDeGestão.Migrations
{
    /// <inheritdoc />
    public partial class InitialMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DiasFuncionamento",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Domingo = table.Column<bool>(type: "bit", nullable: false),
                    Segunda = table.Column<bool>(type: "bit", nullable: false),
                    Terca = table.Column<bool>(type: "bit", nullable: false),
                    Quarta = table.Column<bool>(type: "bit", nullable: false),
                    Quinta = table.Column<bool>(type: "bit", nullable: false),
                    Sexta = table.Column<bool>(type: "bit", nullable: false),
                    Sabado = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiasFuncionamento", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EnderecoEntrega",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Logradouro = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Numero = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Complemento = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Bairro = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Cidade = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CEP = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EnderecoEntrega", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FinalUsers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", maxLength: 450, nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Telefone = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Nome = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinalUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PedidoPagamento",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SubTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TaxaEntrega = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Desconto = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ValorTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    FormaPagamento = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PagamentoAprovado = table.Column<bool>(type: "bit", nullable: false),
                    DataAprovacao = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PedidoPagamento", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PedidosPendentes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TransactionId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PedidoJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PedidosPendentes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Restaurantes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EmailAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NomeDaLoja = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Password = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    refreshToken = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    refreshTokenExpiryTime = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Restaurantes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Categorias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nome = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RestauranteId = table.Column<int>(type: "int", nullable: false),
                    RestauranteId1 = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categorias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Categorias_Restaurantes_RestauranteId",
                        column: x => x.RestauranteId,
                        principalTable: "Restaurantes",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Categorias_Restaurantes_RestauranteId1",
                        column: x => x.RestauranteId1,
                        principalTable: "Restaurantes",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Empresas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CNPJ = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CPF = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RazaoSocial = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NomeFantasia = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Endereco = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Bairro = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Cidade = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Cep = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    HorarioAbertura = table.Column<TimeSpan>(type: "time", nullable: false),
                    HorarioFechamento = table.Column<TimeSpan>(type: "time", nullable: false),
                    Observacoes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RestauranteId = table.Column<int>(type: "int", nullable: false),
                    DiasFuncionamentoId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Empresas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Empresas_DiasFuncionamento_DiasFuncionamentoId",
                        column: x => x.DiasFuncionamentoId,
                        principalTable: "DiasFuncionamento",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Empresas_Restaurantes_RestauranteId",
                        column: x => x.RestauranteId,
                        principalTable: "Restaurantes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GrupoAdicionais",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nome = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Ativo = table.Column<bool>(type: "bit", nullable: false),
                    LimiteSelecao = table.Column<int>(type: "int", nullable: true),
                    RestauranteId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GrupoAdicionais", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GrupoAdicionais_Restaurantes_RestauranteId",
                        column: x => x.RestauranteId,
                        principalTable: "Restaurantes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GrupoComplementos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nome = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Descricao = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Ativo = table.Column<bool>(type: "bit", nullable: false),
                    Obrigatorio = table.Column<bool>(type: "bit", nullable: false),
                    QuantidadeMinima = table.Column<int>(type: "int", nullable: true),
                    QuantidadeMaxima = table.Column<int>(type: "int", nullable: true),
                    RestauranteId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GrupoComplementos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GrupoComplementos_Restaurantes_RestauranteId",
                        column: x => x.RestauranteId,
                        principalTable: "Restaurantes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Pedidos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Numero = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DataPedido = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    FinalUserId = table.Column<int>(type: "int", maxLength: 450, nullable: true),
                    FinalUserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    FinalUserTelefone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    EnderecoEntregaId = table.Column<int>(type: "int", nullable: false),
                    NomeDaLoja = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RestauranteId = table.Column<int>(type: "int", nullable: false),
                    PagamentoId = table.Column<int>(type: "int", nullable: false),
                    Observacoes = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pedidos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Pedidos_EnderecoEntrega_EnderecoEntregaId",
                        column: x => x.EnderecoEntregaId,
                        principalTable: "EnderecoEntrega",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Pedidos_FinalUsers_FinalUserId",
                        column: x => x.FinalUserId,
                        principalTable: "FinalUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Pedidos_PedidoPagamento_PagamentoId",
                        column: x => x.PagamentoId,
                        principalTable: "PedidoPagamento",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Pedidos_Restaurantes_RestauranteId",
                        column: x => x.RestauranteId,
                        principalTable: "Restaurantes",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Produtos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nome = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Descricao = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CategoriaId = table.Column<int>(type: "int", nullable: false),
                    PrecoCusto = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PrecoVenda = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    EstoqueAtual = table.Column<int>(type: "int", nullable: false),
                    EstoqueMinimo = table.Column<int>(type: "int", nullable: false),
                    UnidadeMedida = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Ativo = table.Column<bool>(type: "bit", nullable: false),
                    DataCadastro = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ImagemPrincipalUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LojaId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Produtos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Produtos_Categorias_CategoriaId",
                        column: x => x.CategoriaId,
                        principalTable: "Categorias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Produtos_Restaurantes_LojaId",
                        column: x => x.LojaId,
                        principalTable: "Restaurantes",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Adicionais",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nome = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Descricao = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    PrecoBase = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Ativo = table.Column<bool>(type: "bit", nullable: false),
                    MaximoPorProduto = table.Column<int>(type: "int", nullable: true),
                    GrupoAdicionalId = table.Column<int>(type: "int", nullable: true),
                    EstoqueAtual = table.Column<int>(type: "int", nullable: true),
                    DataCadastro = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Adicionais", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Adicionais_GrupoAdicionais_GrupoAdicionalId",
                        column: x => x.GrupoAdicionalId,
                        principalTable: "GrupoAdicionais",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Complementos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nome = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Descricao = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Preco = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Ativo = table.Column<bool>(type: "bit", nullable: false),
                    MaximoPorProduto = table.Column<int>(type: "int", nullable: true),
                    GrupoComplementoId = table.Column<int>(type: "int", nullable: true),
                    EstoqueAtual = table.Column<int>(type: "int", nullable: true),
                    DataCadastro = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Complementos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Complementos_GrupoComplementos_GrupoComplementoId",
                        column: x => x.GrupoComplementoId,
                        principalTable: "GrupoComplementos",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ItensPedido",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PedidoId = table.Column<int>(type: "int", nullable: false),
                    ProdutoId = table.Column<int>(type: "int", nullable: false),
                    NomeProduto = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Quantidade = table.Column<int>(type: "int", nullable: false),
                    PrecoUnitario = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SubTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PrecoCusto = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Observacoes = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItensPedido", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItensPedido_Pedidos_PedidoId",
                        column: x => x.PedidoId,
                        principalTable: "Pedidos",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ItensPedido_Produtos_ProdutoId",
                        column: x => x.ProdutoId,
                        principalTable: "Produtos",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ProdutoGrupoAdicional",
                columns: table => new
                {
                    ProdutoId = table.Column<int>(type: "int", nullable: false),
                    GrupoAdicionalId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProdutoGrupoAdicional", x => new { x.ProdutoId, x.GrupoAdicionalId });
                    table.ForeignKey(
                        name: "FK_ProdutoGrupoAdicional_GrupoAdicionais_GrupoAdicionalId",
                        column: x => x.GrupoAdicionalId,
                        principalTable: "GrupoAdicionais",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProdutoGrupoAdicional_Produtos_ProdutoId",
                        column: x => x.ProdutoId,
                        principalTable: "Produtos",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ProdutosGruposComplementos",
                columns: table => new
                {
                    ProdutoId = table.Column<int>(type: "int", nullable: false),
                    GrupoComplementoId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProdutosGruposComplementos", x => new { x.ProdutoId, x.GrupoComplementoId });
                    table.ForeignKey(
                        name: "FK_ProdutosGruposComplementos_GrupoComplementos_GrupoComplementoId",
                        column: x => x.GrupoComplementoId,
                        principalTable: "GrupoComplementos",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProdutosGruposComplementos_Produtos_ProdutoId",
                        column: x => x.ProdutoId,
                        principalTable: "Produtos",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ProdutoAdicionais",
                columns: table => new
                {
                    ProdutoId = table.Column<int>(type: "int", nullable: false),
                    AdicionalId = table.Column<int>(type: "int", nullable: false),
                    Id = table.Column<int>(type: "int", nullable: false),
                    PrecoAdicional = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MaximoPorProduto = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProdutoAdicionais", x => new { x.ProdutoId, x.AdicionalId });
                    table.ForeignKey(
                        name: "FK_ProdutoAdicionais_Adicionais_AdicionalId",
                        column: x => x.AdicionalId,
                        principalTable: "Adicionais",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProdutoAdicionais_Produtos_ProdutoId",
                        column: x => x.ProdutoId,
                        principalTable: "Produtos",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ProdutoComplementos",
                columns: table => new
                {
                    ProdutoId = table.Column<int>(type: "int", nullable: false),
                    ComplementoId = table.Column<int>(type: "int", nullable: false),
                    Id = table.Column<int>(type: "int", nullable: false),
                    Obrigatorio = table.Column<bool>(type: "bit", nullable: false),
                    MaximoPorProduto = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProdutoComplementos", x => new { x.ProdutoId, x.ComplementoId });
                    table.ForeignKey(
                        name: "FK_ProdutoComplementos_Complementos_ComplementoId",
                        column: x => x.ComplementoId,
                        principalTable: "Complementos",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProdutoComplementos_Produtos_ProdutoId",
                        column: x => x.ProdutoId,
                        principalTable: "Produtos",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ItemPedidoOpcao",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ItemPedidoId = table.Column<int>(type: "int", nullable: false),
                    TipoOpcao = table.Column<int>(type: "int", nullable: false),
                    ReferenciaId = table.Column<int>(type: "int", nullable: false),
                    Nome = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Quantidade = table.Column<int>(type: "int", nullable: false),
                    PrecoUnitario = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItemPedidoOpcao", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItemPedidoOpcao_ItensPedido_ItemPedidoId",
                        column: x => x.ItemPedidoId,
                        principalTable: "ItensPedido",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Adicionais_GrupoAdicionalId",
                table: "Adicionais",
                column: "GrupoAdicionalId");

            migrationBuilder.CreateIndex(
                name: "IX_Categorias_RestauranteId",
                table: "Categorias",
                column: "RestauranteId");

            migrationBuilder.CreateIndex(
                name: "IX_Categorias_RestauranteId1",
                table: "Categorias",
                column: "RestauranteId1");

            migrationBuilder.CreateIndex(
                name: "IX_Complementos_GrupoComplementoId",
                table: "Complementos",
                column: "GrupoComplementoId");

            migrationBuilder.CreateIndex(
                name: "IX_Empresas_DiasFuncionamentoId",
                table: "Empresas",
                column: "DiasFuncionamentoId");

            migrationBuilder.CreateIndex(
                name: "IX_Empresas_RestauranteId",
                table: "Empresas",
                column: "RestauranteId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GrupoAdicionais_RestauranteId",
                table: "GrupoAdicionais",
                column: "RestauranteId");

            migrationBuilder.CreateIndex(
                name: "IX_GrupoComplementos_RestauranteId",
                table: "GrupoComplementos",
                column: "RestauranteId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemPedidoOpcao_ItemPedidoId",
                table: "ItemPedidoOpcao",
                column: "ItemPedidoId");

            migrationBuilder.CreateIndex(
                name: "IX_ItensPedido_PedidoId",
                table: "ItensPedido",
                column: "PedidoId");

            migrationBuilder.CreateIndex(
                name: "IX_ItensPedido_ProdutoId",
                table: "ItensPedido",
                column: "ProdutoId");

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_EnderecoEntregaId",
                table: "Pedidos",
                column: "EnderecoEntregaId");

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_FinalUserId",
                table: "Pedidos",
                column: "FinalUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_PagamentoId",
                table: "Pedidos",
                column: "PagamentoId");

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_RestauranteId",
                table: "Pedidos",
                column: "RestauranteId");

            migrationBuilder.CreateIndex(
                name: "IX_ProdutoAdicionais_AdicionalId",
                table: "ProdutoAdicionais",
                column: "AdicionalId");

            migrationBuilder.CreateIndex(
                name: "IX_ProdutoComplementos_ComplementoId",
                table: "ProdutoComplementos",
                column: "ComplementoId");

            migrationBuilder.CreateIndex(
                name: "IX_ProdutoGrupoAdicional_GrupoAdicionalId",
                table: "ProdutoGrupoAdicional",
                column: "GrupoAdicionalId");

            migrationBuilder.CreateIndex(
                name: "IX_Produtos_CategoriaId",
                table: "Produtos",
                column: "CategoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_Produtos_LojaId",
                table: "Produtos",
                column: "LojaId");

            migrationBuilder.CreateIndex(
                name: "IX_ProdutosGruposComplementos_GrupoComplementoId",
                table: "ProdutosGruposComplementos",
                column: "GrupoComplementoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Empresas");

            migrationBuilder.DropTable(
                name: "ItemPedidoOpcao");

            migrationBuilder.DropTable(
                name: "PedidosPendentes");

            migrationBuilder.DropTable(
                name: "ProdutoAdicionais");

            migrationBuilder.DropTable(
                name: "ProdutoComplementos");

            migrationBuilder.DropTable(
                name: "ProdutoGrupoAdicional");

            migrationBuilder.DropTable(
                name: "ProdutosGruposComplementos");

            migrationBuilder.DropTable(
                name: "DiasFuncionamento");

            migrationBuilder.DropTable(
                name: "ItensPedido");

            migrationBuilder.DropTable(
                name: "Adicionais");

            migrationBuilder.DropTable(
                name: "Complementos");

            migrationBuilder.DropTable(
                name: "Pedidos");

            migrationBuilder.DropTable(
                name: "Produtos");

            migrationBuilder.DropTable(
                name: "GrupoAdicionais");

            migrationBuilder.DropTable(
                name: "GrupoComplementos");

            migrationBuilder.DropTable(
                name: "EnderecoEntrega");

            migrationBuilder.DropTable(
                name: "FinalUsers");

            migrationBuilder.DropTable(
                name: "PedidoPagamento");

            migrationBuilder.DropTable(
                name: "Categorias");

            migrationBuilder.DropTable(
                name: "Restaurantes");
        }
    }
}
