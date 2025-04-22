namespace SistemaDeGestao.Models
{
    public class ItemPedidoOpcaoDTO
    {
        public TipoOpcaoExtra TipoOpcao { get; set; }
        public int ReferenciaId { get; set; }
        public string Nome { get; set; }
        public int Quantidade { get; set; }
        public decimal PrecoUnitario { get; set; }
    }
}
