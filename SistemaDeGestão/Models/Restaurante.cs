namespace SistemaDeGestao.Models
{
    public class Restaurante
    {
        public int Id { get; set; }
        public string UserName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? EmailAddress { get; set; }
        public string? NomeDaLoja { get; set; }
        public string Password { get; set; }
        public string? refreshToken { get; set; }
        public DateTime refreshTokenExpiryTime { get; set; }

        public virtual Empresa Empresa { get; set; }
        public virtual ICollection<Produto> Produtos { get; set; }
        public virtual ICollection<Categoria> Categorias { get; set; }

        //relacionamento com a tabela de credenciais
        public virtual RestauranteCredencialMercadoPago CredencialMercadoPago { get; set; }
    }
}