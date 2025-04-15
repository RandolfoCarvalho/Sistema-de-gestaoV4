namespace SistemaDeGestão.Models
{
    public class FinalUser
    {
        public int Id { get; set; }
        public string Telefone { get; set; }
        public string Nome { get; set; }
        public DateTime DataCriacao { get; set; }
        public ICollection<Pedido>? Pedidos { get; set; }

        public static implicit operator string(FinalUser v)
        {
            throw new NotImplementedException();
        }
    }
}
