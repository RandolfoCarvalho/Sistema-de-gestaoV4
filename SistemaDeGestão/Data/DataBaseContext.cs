using Microsoft.EntityFrameworkCore;
using SistemaDeGestão.Models;

namespace SistemaDeGestão.Data
{
    public class DataBaseContext : DbContext
    {
        public DataBaseContext() { }

        public DataBaseContext(DbContextOptions<DataBaseContext> options) : base(options) { }

        public DbSet<Restaurante> Restaurantes { get; set; }
        public DbSet<Produto> Produtos { get; set; }
        public DbSet<Adicional> Adicionais { get; set; }
        public DbSet<GrupoAdicional> GrupoAdicionais { get; set; }
        public DbSet<Complemento> Complementos { get; set; }
        public DbSet<GrupoComplemento> GrupoComplementos { get; set; }
        public DbSet<ProdutoComplemento> ProdutoComplementos { get; set; }
        public DbSet<Pedido> Pedidos { get; set; }
        public DbSet<PedidoPendente> PedidosPendentes { get; set; }
        public DbSet<ItemPedido> ItensPedido { get; set; }
        public DbSet<ProdutoAdicional> ProdutoAdicionais { get; set; }
        public DbSet<ProdutoGrupoComplemento> ProdutosGruposComplementos { get; set; }
        public DbSet<ProdutoGrupoAdicional> ProdutoGrupoAdicional { get; set; }
        public DbSet<Empresa> Empresas { get; set; }
        public DbSet<Categoria> Categorias { get; set; }
        public DbSet<FinalUser> FinalUsers { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Grupo complemento
            modelBuilder.Entity<ProdutoGrupoComplemento>(entity =>
            {
                entity.HasKey(bp => new { bp.ProdutoId, bp.GrupoComplementoId });

                entity.HasOne(bp => bp.Produto)
                .WithMany(b => b.ProdutosGruposComplementos)
                .HasForeignKey(bp => bp.ProdutoId)
                .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(bp => bp.GrupoComplemento)
                .WithMany(b => b.ProdutosGruposComplementos)
                .HasForeignKey(bp => bp.GrupoComplementoId)
                .OnDelete(DeleteBehavior.NoAction);
            });

            modelBuilder.Entity<ProdutoGrupoAdicional>(entity =>
            {
                entity.HasKey(bp => new { bp.ProdutoId, bp.GrupoAdicionalId });

                entity.HasOne(bp => bp.Produto)
                .WithMany(b => b.ProdutosGruposAdicionais)
                .HasForeignKey(bp => bp.ProdutoId)
                .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(bp => bp.GrupoAdicional)
                .WithMany(b => b.ProdutosGruposAdicionais)
                .HasForeignKey(bp => bp.GrupoAdicionalId)
                .OnDelete(DeleteBehavior.NoAction);
            });

            // Configuração da relação Produto-Restaurante
            modelBuilder.Entity<Produto>()
            .HasOne(p => p.Restaurante)
            .WithMany(r => r.Produtos)
            .HasForeignKey(p => p.LojaId)
            .OnDelete(DeleteBehavior.NoAction);

            // Configuração da relação ItemPedido-Produto
            modelBuilder.Entity<ItemPedido>()
            .HasOne(ip => ip.Produto)
            .WithMany()  // Não há propriedade de navegação em Produto para ItemPedido
            .HasForeignKey(ip => ip.ProdutoId)
            .OnDelete(DeleteBehavior.NoAction);

            // Configuração da relação ItemPedido-Pedido
            modelBuilder.Entity<ItemPedido>()
            .HasOne(ip => ip.Pedido)
            .WithMany(p => p.Itens)
            .HasForeignKey(ip => ip.PedidoId)
            .OnDelete(DeleteBehavior.NoAction);

            // Configuração da relação ItemPedidoOpcao-ItemPedido
            modelBuilder.Entity<ItemPedidoOpcao>()
            .HasOne(ipo => ipo.ItemPedido)
            .WithMany(ip => ip.OpcoesExtras)
            .HasForeignKey(ipo => ipo.ItemPedidoId)
            .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ProdutoComplemento>()
                .HasKey(pc => new { pc.ProdutoId, pc.ComplementoId });

                modelBuilder.Entity<ProdutoComplemento>()
                    .HasOne(pc => pc.Produto)
                    .WithMany(p => p.Complementos)
                    .HasForeignKey(pc => pc.ProdutoId)
                    .OnDelete(DeleteBehavior.NoAction);

                modelBuilder.Entity<ProdutoComplemento>()
                    .HasOne(pc => pc.Complemento)
                    .WithMany(c => c.Produtos)
                    .HasForeignKey(pc => pc.ComplementoId)
                    .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ProdutoAdicional>()
                .HasKey(pa => new { pa.ProdutoId, pa.AdicionalId });

                modelBuilder.Entity<ProdutoAdicional>()
                    .HasOne(pa => pa.Produto)
                    .WithMany(p => p.Adicionais)
                    .HasForeignKey(pa => pa.ProdutoId)
                    .OnDelete(DeleteBehavior.NoAction);

                modelBuilder.Entity<ProdutoAdicional>()
                    .HasOne(pa => pa.Adicional)
                    .WithMany(pa => pa.Produtos) // Se quiser, pode adicionar uma lista de ProdutoAdicional no Adicional depois
                    .HasForeignKey(pa => pa.AdicionalId)
                    .OnDelete(DeleteBehavior.NoAction);


            // Configuração da relação Categoria-Restaurante
            modelBuilder.Entity<Categoria>()
            .HasOne(c => c.Restaurante)
            .WithMany()  // Não temos essa propriedade no modelo Restaurante
            .HasForeignKey(c => c.RestauranteId)
            .OnDelete(DeleteBehavior.NoAction);

            // Configuração da relação Pedido-Restaurante
            modelBuilder.Entity<Pedido>()
            .HasOne(p => p.Restaurante)
            .WithMany()  // Não temos essa propriedade no modelo Restaurante
            .HasForeignKey(p => p.RestauranteId)
            .OnDelete(DeleteBehavior.NoAction);

            // Configuração da entidade User
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
            .IsRequired(false)  // Permite que FinalUserId seja null
            .OnDelete(DeleteBehavior.NoAction);

            // Configurar as propriedades do Pedido
            modelBuilder.Entity<Pedido>(entity =>
            {
                entity.Property(e => e.FinalUserId).HasMaxLength(450);  // Ajuste conforme necessário
                entity.Property(e => e.FinalUserName).HasMaxLength(256);
                entity.Property(e => e.FinalUserTelefone).HasMaxLength(20);
                // ... outras configurações
            });

            // Configurar FinalUser
            modelBuilder.Entity<FinalUser>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasMaxLength(450);  // Ajuste conforme necessário
                                                               // ... outras configurações
            });

            base.OnModelCreating(modelBuilder);
        }
    }
}