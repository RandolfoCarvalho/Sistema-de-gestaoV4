using Microsoft.EntityFrameworkCore;
using SistemaDeGestao.Models;

namespace SistemaDeGestao.Data
{
    public class DataBaseContext : DbContext
    {
        public DataBaseContext() { }

        public DataBaseContext(DbContextOptions<DataBaseContext> options) : base(options) { }

        //DbSets...
        public DbSet<Restaurante> Restaurantes { get; set; }
        public DbSet<Produto> Produtos { get; set; }
        public DbSet<Adicional> Adicionais { get; set; }
        public DbSet<GrupoAdicional> GrupoAdicionais { get; set; }
        public DbSet<Complemento> Complementos { get; set; }
        public DbSet<GrupoComplemento> GrupoComplementos { get; set; }
        public DbSet<ProdutoComplemento> ProdutoComplementos { get; set; }
        public DbSet<Pedido> Pedidos { get; set; }
        public DbSet<PedidoPendente> PedidosPendentes { get; set; }
        public DbSet<PedidoCancelado> PedidosCancelados { get; set; }
        public DbSet<ItemPedido> ItensPedido { get; set; }
        public DbSet<ProdutoAdicional> ProdutoAdicionais { get; set; }
        public DbSet<ProdutoGrupoComplemento> ProdutosGruposComplementos { get; set; }
        public DbSet<ProdutoGrupoAdicional> ProdutoGrupoAdicional { get; set; }
        public DbSet<EnderecoEntrega> EnderecosEntregas { get; set; }
        public DbSet<Empresa> Empresas { get; set; }
        public DbSet<Categoria> Categorias { get; set; }
        public DbSet<FinalUser> FinalUsers { get; set; }
        public DbSet<ModeloMensagem> ModelosMensagem { get; set; }
        public DbSet<RestauranteCredencialMercadoPago> RestauranteCredenciaisMercadoPago { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // =================================================================================
            // <<< CONFIGURAÇÕES DE EXCLUSÃO PARA ADICIONAIS E COMPLEMENTOS >>>
            // =================================================================================

            // --- GRUPOS E SEUS ITENS ---

            // Ao deletar um GrupoAdicional, todos os Adicionais filhos serão deletados em cascata.
            modelBuilder.Entity<GrupoAdicional>()
                .HasMany(g => g.Adicionais)
                .WithOne(a => a.GrupoAdicional)
                .HasForeignKey(a => a.GrupoAdicionalId)
                .OnDelete(DeleteBehavior.Cascade);

            // Ao deletar um GrupoComplemento, todos os Complementos filhos serão deletados em cascata.
            modelBuilder.Entity<GrupoComplemento>()
                .HasMany(g => g.Complementos)
                .WithOne(c => c.GrupoComplemento)
                .HasForeignKey(c => c.GrupoComplementoId)
                .OnDelete(DeleteBehavior.Cascade);

            // --- VÍNCULOS DE PRODUTOS COM GRUPOS (TABELAS DE JUNÇÃO) ---

            // Ao deletar um GrupoAdicional, remove o vínculo dele com os Produtos.
            modelBuilder.Entity<ProdutoGrupoAdicional>(entity =>
            {
                entity.HasKey(bp => new { bp.ProdutoId, bp.GrupoAdicionalId });
                entity.HasOne(bp => bp.Produto)
                    .WithMany(b => b.ProdutosGruposAdicionais)
                    .HasForeignKey(bp => bp.ProdutoId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(bp => bp.GrupoAdicional)
                    .WithMany(b => b.ProdutosGruposAdicionais)
                    .HasForeignKey(bp => bp.GrupoAdicionalId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Ao deletar um GrupoComplemento, remove o vínculo dele com os Produtos.
            modelBuilder.Entity<ProdutoGrupoComplemento>(entity =>
            {
                entity.HasKey(bp => new { bp.ProdutoId, bp.GrupoComplementoId });
                entity.HasOne(bp => bp.Produto)
                    .WithMany(b => b.ProdutosGruposComplementos)
                    .HasForeignKey(bp => bp.ProdutoId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(bp => bp.GrupoComplemento)
                    .WithMany(b => b.ProdutosGruposComplementos)
                    .HasForeignKey(bp => bp.GrupoComplementoId)
                    .OnDelete(DeleteBehavior.Cascade); // REMOVE O VÍNCULO
            });

            // --- VÍNCULOS DE PRODUTOS COM ITENS INDIVIDUAIS (TABELAS DE JUNÇÃO) ---

            // Ao deletar um Adicional, remove o vínculo dele com os Produtos.
            modelBuilder.Entity<ProdutoAdicional>(entity =>
            {
                entity.HasKey(pa => new { pa.ProdutoId, pa.AdicionalId });
                entity.HasOne(pa => pa.Produto)
                    .WithMany(p => p.Adicionais)
                    .HasForeignKey(pa => pa.ProdutoId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(pa => pa.Adicional)
                    .WithMany(a => a.Produtos)
                    .HasForeignKey(pa => pa.AdicionalId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Ao deletar um Complemento, remove o vínculo dele com os Produtos.
            modelBuilder.Entity<ProdutoComplemento>(entity =>
            {
                entity.HasKey(pc => new { pc.ProdutoId, pc.ComplementoId });
                entity.HasOne(pc => pc.Produto)
                    .WithMany(p => p.Complementos)
                    .HasForeignKey(pc => pc.ProdutoId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(pc => pc.Complemento)
                    .WithMany(c => c.Produtos)
                    .HasForeignKey(pc => pc.ComplementoId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // =================================================================================
            // <<< RESTANTE DAS SUAS CONFIGURAÇÕES >>>
            // =================================================================================

            // Tabela credenciais no banco de dados
            modelBuilder.Entity<Restaurante>()
                .HasOne(r => r.CredencialMercadoPago)
                .WithOne(c => c.Restaurante)
                .HasForeignKey<RestauranteCredencialMercadoPago>(c => c.RestauranteId);

            // Pedido para -> pagamento
            modelBuilder.Entity<Pedido>()
                .HasOne(p => p.Pagamento)
                .WithOne(pag => pag.Pedido)
                .HasForeignKey<Pedido>(p => p.PagamentoId)
                .OnDelete(DeleteBehavior.Cascade);

            // Pedido para -> endereco de entrega
            modelBuilder.Entity<Pedido>()
                .HasOne(p => p.EnderecoEntrega)
                .WithMany()
                .HasForeignKey(p => p.EnderecoEntregaId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            // Configuração da relação Produto-Restaurante
            modelBuilder.Entity<Produto>()
                .HasOne(p => p.Restaurante)
                .WithMany(r => r.Produtos)
                .HasForeignKey(p => p.LojaId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configuração da relação ItemPedido-Produto
            modelBuilder.Entity<ItemPedido>()
                .HasOne(ip => ip.Produto)
                .WithMany()
                .HasForeignKey(ip => ip.ProdutoId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Pedido>()
                .HasMany(p => p.Itens)
                .WithOne(ip => ip.Pedido)
                .HasForeignKey(ip => ip.PedidoId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configuração da relação ItemPedidoOpcao-ItemPedido
            // Nota: ItemPedidoOpcao não está nos seus DbSets, mas mantive a configuração
            modelBuilder.Entity<ItemPedidoOpcao>()
                .HasOne(ipo => ipo.ItemPedido)
                .WithMany(ip => ip.OpcoesExtras)
                .HasForeignKey(ipo => ipo.ItemPedidoId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configuração da relação Categoria-Restaurante
            modelBuilder.Entity<Categoria>()
                .HasOne(c => c.Restaurante)
                .WithMany(r => r.Categorias)
                .HasForeignKey(c => c.RestauranteId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configuração da relação Pedido-Restaurante
            modelBuilder.Entity<Pedido>()
                .HasOne(p => p.Restaurante)
                .WithMany()
                .HasForeignKey(p => p.RestauranteId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configuração da entidade User (Restaurante)
            modelBuilder.Entity<Restaurante>()
                .HasKey(u => u.Id);
            modelBuilder.Entity<Restaurante>()
                .Property(u => u.UserName)
                .IsRequired()
                .HasMaxLength(50);

            // Configuração da relação Pedido-FinalUser
            modelBuilder.Entity<Pedido>()
                .HasOne(p => p.FinalUser)
                .WithMany(f => f.Pedidos)
                .HasForeignKey(p => p.FinalUserId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            // Configurar as propriedades do Pedido
            modelBuilder.Entity<Pedido>(entity =>
            {
                entity.Property(e => e.FinalUserId).HasMaxLength(255);
                entity.Property(e => e.FinalUserName).HasMaxLength(256);
                entity.Property(e => e.FinalUserTelefone).HasMaxLength(20);
            });

            // Configurar FinalUser
            modelBuilder.Entity<FinalUser>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasMaxLength(255);
            });

            base.OnModelCreating(modelBuilder);
        }
    }
}