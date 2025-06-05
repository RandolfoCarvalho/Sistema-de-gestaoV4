namespace SistemaDeGestao.Models.DTOs.Responses
{
    public class PagamentoDinheiroResponseDTO
    {
        public string NumeroPedido { get; set; }
        public string Status { get; set; }
        public string Message { get; set; }
        public DateTime Timestamp { get; set; }
       
    }
}
