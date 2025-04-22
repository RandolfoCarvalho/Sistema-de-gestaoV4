IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE TABLE [DiasFuncionamento] (
        [Id] int NOT NULL IDENTITY,
        [Domingo] bit NOT NULL,
        [Segunda] bit NOT NULL,
        [Terca] bit NOT NULL,
        [Quarta] bit NOT NULL,
        [Quinta] bit NOT NULL,
        [Sexta] bit NOT NULL,
        [Sabado] bit NOT NULL,
        CONSTRAINT [PK_DiasFuncionamento] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE TABLE [EnderecoEntrega] (
        [Id] int NOT NULL IDENTITY,
        [Logradouro] nvarchar(max) NOT NULL,
        [Numero] nvarchar(max) NOT NULL,
        [Complemento] nvarchar(max) NOT NULL,
        [Bairro] nvarchar(max) NOT NULL,
        [Cidade] nvarchar(max) NOT NULL,
        [CEP] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_EnderecoEntrega] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE TABLE [FinalUsers] (
        [Id] int NOT NULL IDENTITY,
        [Telefone] nvarchar(max) NOT NULL,
        [Nome] nvarchar(max) NOT NULL,
        [DataCriacao] datetime2 NOT NULL,
        CONSTRAINT [PK_FinalUsers] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE TABLE [PedidoPagamento] (
        [Id] int NOT NULL IDENTITY,
        [SubTotal] decimal(18,2) NOT NULL,
        [TaxaEntrega] decimal(18,2) NOT NULL,
        [Desconto] decimal(18,2) NOT NULL,
        [ValorTotal] decimal(18,2) NOT NULL,
        [FormaPagamento] nvarchar(max) NOT NULL,
        [PagamentoAprovado] bit NOT NULL,
        [DataAprovacao] datetime2 NULL,
        CONSTRAINT [PK_PedidoPagamento] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE TABLE [PedidosPendentes] (
        [Id] int NOT NULL IDENTITY,
        [TransactionId] nvarchar(max) NOT NULL,
        [PedidoJson] nvarchar(max) NOT NULL,
        [DataCriacao] datetime2 NOT NULL,
        CONSTRAINT [PK_PedidosPendentes] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE TABLE [Restaurantes] (
        [Id] int NOT NULL IDENTITY,
        [UserName] nvarchar(50) NOT NULL,
        [PhoneNumber] nvarchar(max) NULL,
        [EmailAddress] nvarchar(max) NULL,
        [NomeDaLoja] nvarchar(max) NULL,
        [Password] nvarchar(max) NOT NULL,
        [refreshToken] nvarchar(max) NULL,
        [refreshTokenExpiryTime] datetime2 NOT NULL,
        CONSTRAINT [PK_Restaurantes] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE TABLE [Categorias] (
        [Id] int NOT NULL IDENTITY,
        [Nome] nvarchar(max) NOT NULL,
        [RestauranteId] int NOT NULL,
        [RestauranteId1] int NULL,
        CONSTRAINT [PK_Categorias] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Categorias_Restaurantes_RestauranteId] FOREIGN KEY ([RestauranteId]) REFERENCES [Restaurantes] ([Id]),
        CONSTRAINT [FK_Categorias_Restaurantes_RestauranteId1] FOREIGN KEY ([RestauranteId1]) REFERENCES [Restaurantes] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE TABLE [Empresas] (
        [Id] int NOT NULL IDENTITY,
        [CNPJ] nvarchar(max) NULL,
        [CPF] nvarchar(max) NULL,
        [RazaoSocial] nvarchar(max) NULL,
        [NomeFantasia] nvarchar(max) NULL,
        [Endereco] nvarchar(max) NULL,
        [Bairro] nvarchar(max) NULL,
        [Cidade] nvarchar(max) NULL,
        [Estado] nvarchar(max) NULL,
        [Cep] nvarchar(max) NULL,
        [HorarioAbertura] time NOT NULL,
        [HorarioFechamento] time NOT NULL,
        [Observacoes] nvarchar(max) NULL,
        [RestauranteId] int NOT NULL,
        [DiasFuncionamentoId] int NOT NULL,
        CONSTRAINT [PK_Empresas] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Empresas_DiasFuncionamento_DiasFuncionamentoId] FOREIGN KEY ([DiasFuncionamentoId]) REFERENCES [DiasFuncionamento] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Empresas_Restaurantes_RestauranteId] FOREIGN KEY ([RestauranteId]) REFERENCES [Restaurantes] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE TABLE [GrupoAdicionais] (
        [Id] int NOT NULL IDENTITY,
        [Nome] nvarchar(100) NOT NULL,
        [Ativo] bit NOT NULL,
        [LimiteSelecao] int NULL,
        [RestauranteId] int NOT NULL,
        CONSTRAINT [PK_GrupoAdicionais] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_GrupoAdicionais_Restaurantes_RestauranteId] FOREIGN KEY ([RestauranteId]) REFERENCES [Restaurantes] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE TABLE [GrupoComplementos] (
        [Id] int NOT NULL IDENTITY,
        [Nome] nvarchar(100) NOT NULL,
        [Descricao] nvarchar(max) NOT NULL,
        [Ativo] bit NOT NULL,
        [Obrigatorio] bit NOT NULL,
        [QuantidadeMinima] int NULL,
        [QuantidadeMaxima] int NULL,
        [RestauranteId] int NOT NULL,
        CONSTRAINT [PK_GrupoComplementos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_GrupoComplementos_Restaurantes_RestauranteId] FOREIGN KEY ([RestauranteId]) REFERENCES [Restaurantes] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE TABLE [Pedidos] (
        [Id] int NOT NULL IDENTITY,
        [Numero] nvarchar(max) NOT NULL,
        [DataPedido] datetime2 NOT NULL,
        [Status] int NOT NULL,
        [FinalUserId] int NULL,
        [FinalUserName] nvarchar(256) NOT NULL,
        [FinalUserTelefone] nvarchar(20) NOT NULL,
        [EnderecoEntregaId] int NOT NULL,
        [NomeDaLoja] nvarchar(max) NOT NULL,
        [RestauranteId] int NOT NULL,
        [PagamentoId] int NOT NULL,
        [Observacoes] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_Pedidos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Pedidos_EnderecoEntrega_EnderecoEntregaId] FOREIGN KEY ([EnderecoEntregaId]) REFERENCES [EnderecoEntrega] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Pedidos_FinalUsers_FinalUserId] FOREIGN KEY ([FinalUserId]) REFERENCES [FinalUsers] ([Id]),
        CONSTRAINT [FK_Pedidos_PedidoPagamento_PagamentoId] FOREIGN KEY ([PagamentoId]) REFERENCES [PedidoPagamento] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Pedidos_Restaurantes_RestauranteId] FOREIGN KEY ([RestauranteId]) REFERENCES [Restaurantes] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE TABLE [Produtos] (
        [Id] int NOT NULL IDENTITY,
        [Nome] nvarchar(100) NOT NULL,
        [Descricao] nvarchar(500) NULL,
        [CategoriaId] int NOT NULL,
        [PrecoCusto] decimal(18,2) NOT NULL,
        [PrecoVenda] decimal(18,2) NOT NULL,
        [EstoqueAtual] int NOT NULL,
        [EstoqueMinimo] int NOT NULL,
        [UnidadeMedida] nvarchar(max) NULL,
        [Ativo] bit NOT NULL,
        [DataCadastro] datetime2 NOT NULL,
        [ImagemPrincipalUrl] nvarchar(max) NULL,
        [LojaId] int NOT NULL,
        CONSTRAINT [PK_Produtos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Produtos_Categorias_CategoriaId] FOREIGN KEY ([CategoriaId]) REFERENCES [Categorias] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Produtos_Restaurantes_LojaId] FOREIGN KEY ([LojaId]) REFERENCES [Restaurantes] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE TABLE [Adicionais] (
        [Id] int NOT NULL IDENTITY,
        [Nome] nvarchar(100) NOT NULL,
        [Descricao] nvarchar(500) NOT NULL,
        [PrecoBase] decimal(18,2) NOT NULL,
        [Ativo] bit NOT NULL,
        [MaximoPorProduto] int NULL,
        [GrupoAdicionalId] int NULL,
        [EstoqueAtual] int NULL,
        [DataCadastro] datetime2 NOT NULL,
        CONSTRAINT [PK_Adicionais] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Adicionais_GrupoAdicionais_GrupoAdicionalId] FOREIGN KEY ([GrupoAdicionalId]) REFERENCES [GrupoAdicionais] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE TABLE [Complementos] (
        [Id] int NOT NULL IDENTITY,
        [Nome] nvarchar(100) NOT NULL,
        [Descricao] nvarchar(500) NOT NULL,
        [Preco] decimal(18,2) NOT NULL,
        [Ativo] bit NOT NULL,
        [MaximoPorProduto] int NULL,
        [GrupoComplementoId] int NULL,
        [EstoqueAtual] int NULL,
        [DataCadastro] datetime2 NOT NULL,
        CONSTRAINT [PK_Complementos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Complementos_GrupoComplementos_GrupoComplementoId] FOREIGN KEY ([GrupoComplementoId]) REFERENCES [GrupoComplementos] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE TABLE [ItensPedido] (
        [Id] int NOT NULL IDENTITY,
        [PedidoId] int NOT NULL,
        [ProdutoId] int NOT NULL,
        [NomeProduto] nvarchar(max) NOT NULL,
        [Quantidade] int NOT NULL,
        [PrecoUnitario] decimal(18,2) NOT NULL,
        [SubTotal] decimal(18,2) NOT NULL,
        [PrecoCusto] decimal(18,2) NOT NULL,
        [Observacoes] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_ItensPedido] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ItensPedido_Pedidos_PedidoId] FOREIGN KEY ([PedidoId]) REFERENCES [Pedidos] ([Id]),
        CONSTRAINT [FK_ItensPedido_Produtos_ProdutoId] FOREIGN KEY ([ProdutoId]) REFERENCES [Produtos] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE TABLE [ProdutoGrupoAdicional] (
        [ProdutoId] int NOT NULL,
        [GrupoAdicionalId] int NOT NULL,
        CONSTRAINT [PK_ProdutoGrupoAdicional] PRIMARY KEY ([ProdutoId], [GrupoAdicionalId]),
        CONSTRAINT [FK_ProdutoGrupoAdicional_GrupoAdicionais_GrupoAdicionalId] FOREIGN KEY ([GrupoAdicionalId]) REFERENCES [GrupoAdicionais] ([Id]),
        CONSTRAINT [FK_ProdutoGrupoAdicional_Produtos_ProdutoId] FOREIGN KEY ([ProdutoId]) REFERENCES [Produtos] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE TABLE [ProdutosGruposComplementos] (
        [ProdutoId] int NOT NULL,
        [GrupoComplementoId] int NOT NULL,
        CONSTRAINT [PK_ProdutosGruposComplementos] PRIMARY KEY ([ProdutoId], [GrupoComplementoId]),
        CONSTRAINT [FK_ProdutosGruposComplementos_GrupoComplementos_GrupoComplementoId] FOREIGN KEY ([GrupoComplementoId]) REFERENCES [GrupoComplementos] ([Id]),
        CONSTRAINT [FK_ProdutosGruposComplementos_Produtos_ProdutoId] FOREIGN KEY ([ProdutoId]) REFERENCES [Produtos] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE TABLE [ProdutoAdicionais] (
        [Id] int NOT NULL IDENTITY,
        [ProdutoId] int NOT NULL,
        [AdicionalId] int NOT NULL,
        [PrecoAdicional] decimal(18,2) NOT NULL,
        [MaximoPorProduto] int NULL,
        [AdicionalId1] int NULL,
        CONSTRAINT [PK_ProdutoAdicionais] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProdutoAdicionais_Adicionais_AdicionalId] FOREIGN KEY ([AdicionalId]) REFERENCES [Adicionais] ([Id]),
        CONSTRAINT [FK_ProdutoAdicionais_Adicionais_AdicionalId1] FOREIGN KEY ([AdicionalId1]) REFERENCES [Adicionais] ([Id]),
        CONSTRAINT [FK_ProdutoAdicionais_Produtos_ProdutoId] FOREIGN KEY ([ProdutoId]) REFERENCES [Produtos] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE TABLE [ProdutoComplementos] (
        [Id] int NOT NULL IDENTITY,
        [ProdutoId] int NOT NULL,
        [ComplementoId] int NOT NULL,
        [Obrigatorio] bit NOT NULL,
        [MaximoPorProduto] int NULL,
        [ComplementoId1] int NULL,
        CONSTRAINT [PK_ProdutoComplementos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProdutoComplementos_Complementos_ComplementoId] FOREIGN KEY ([ComplementoId]) REFERENCES [Complementos] ([Id]),
        CONSTRAINT [FK_ProdutoComplementos_Complementos_ComplementoId1] FOREIGN KEY ([ComplementoId1]) REFERENCES [Complementos] ([Id]),
        CONSTRAINT [FK_ProdutoComplementos_Produtos_ProdutoId] FOREIGN KEY ([ProdutoId]) REFERENCES [Produtos] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE TABLE [ItemPedidoOpcao] (
        [Id] int NOT NULL IDENTITY,
        [ItemPedidoId] int NOT NULL,
        [TipoOpcao] int NOT NULL,
        [ReferenciaId] int NOT NULL,
        [Nome] nvarchar(max) NOT NULL,
        [Quantidade] int NOT NULL,
        [PrecoUnitario] decimal(18,2) NOT NULL,
        CONSTRAINT [PK_ItemPedidoOpcao] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ItemPedidoOpcao_ItensPedido_ItemPedidoId] FOREIGN KEY ([ItemPedidoId]) REFERENCES [ItensPedido] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE INDEX [IX_Adicionais_GrupoAdicionalId] ON [Adicionais] ([GrupoAdicionalId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE INDEX [IX_Categorias_RestauranteId] ON [Categorias] ([RestauranteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE INDEX [IX_Categorias_RestauranteId1] ON [Categorias] ([RestauranteId1]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE INDEX [IX_Complementos_GrupoComplementoId] ON [Complementos] ([GrupoComplementoId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE INDEX [IX_Empresas_DiasFuncionamentoId] ON [Empresas] ([DiasFuncionamentoId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Empresas_RestauranteId] ON [Empresas] ([RestauranteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE INDEX [IX_GrupoAdicionais_RestauranteId] ON [GrupoAdicionais] ([RestauranteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE INDEX [IX_GrupoComplementos_RestauranteId] ON [GrupoComplementos] ([RestauranteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE INDEX [IX_ItemPedidoOpcao_ItemPedidoId] ON [ItemPedidoOpcao] ([ItemPedidoId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE INDEX [IX_ItensPedido_PedidoId] ON [ItensPedido] ([PedidoId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE INDEX [IX_ItensPedido_ProdutoId] ON [ItensPedido] ([ProdutoId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE INDEX [IX_Pedidos_EnderecoEntregaId] ON [Pedidos] ([EnderecoEntregaId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE INDEX [IX_Pedidos_FinalUserId] ON [Pedidos] ([FinalUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE INDEX [IX_Pedidos_PagamentoId] ON [Pedidos] ([PagamentoId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE INDEX [IX_Pedidos_RestauranteId] ON [Pedidos] ([RestauranteId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE INDEX [IX_ProdutoAdicionais_AdicionalId] ON [ProdutoAdicionais] ([AdicionalId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE INDEX [IX_ProdutoAdicionais_AdicionalId1] ON [ProdutoAdicionais] ([AdicionalId1]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE INDEX [IX_ProdutoAdicionais_ProdutoId] ON [ProdutoAdicionais] ([ProdutoId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE INDEX [IX_ProdutoComplementos_ComplementoId] ON [ProdutoComplementos] ([ComplementoId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE INDEX [IX_ProdutoComplementos_ComplementoId1] ON [ProdutoComplementos] ([ComplementoId1]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE INDEX [IX_ProdutoComplementos_ProdutoId] ON [ProdutoComplementos] ([ProdutoId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE INDEX [IX_ProdutoGrupoAdicional_GrupoAdicionalId] ON [ProdutoGrupoAdicional] ([GrupoAdicionalId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE INDEX [IX_Produtos_CategoriaId] ON [Produtos] ([CategoriaId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE INDEX [IX_Produtos_LojaId] ON [Produtos] ([LojaId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    CREATE INDEX [IX_ProdutosGruposComplementos_GrupoComplementoId] ON [ProdutosGruposComplementos] ([GrupoComplementoId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250410001956_FirstMigration'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250410001956_FirstMigration', N'8.0.8');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250411001006_SecondMigration'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250411001006_SecondMigration', N'8.0.8');
END;
GO

COMMIT;
GO

