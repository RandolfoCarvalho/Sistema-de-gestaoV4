namespace SistemaDeGestao.Models.DTOs.Resquests
{
    public class CancelamentoPedidoRequest
    {
        public int PedidoId { get; set; }
        public string MotivoCancelamento { get; set; }
        public string CodigoReembolso { get; set; }
        public decimal ValorReembolsado { get; set; }
        public string TransacaoReembolsoId { get; set; }
        public bool EstaReembolsado { get; set; }
        public int FinalUserId { get; set; }
    }
}
