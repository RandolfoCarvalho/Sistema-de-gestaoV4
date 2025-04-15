namespace SistemaDeGestão.Models.DTOs.Responses
{
    public class PagamentoPixResponse
    {
        public string QrCodeBase64 { get; set; }
        public string QrCodeString { get; set; }
        public string IdPagamento { get; set; }
        public decimal ValorTotal { get; set; }
    }
}