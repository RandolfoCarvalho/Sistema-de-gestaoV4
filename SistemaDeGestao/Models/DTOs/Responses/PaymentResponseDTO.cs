namespace SistemaDeGestao.Models.DTOs.Responses
{
    public class PaymentResponseDTO
    {
        public string TransactionId { get; set; }
        public string Status { get; set; }
        public string Message { get; set; }
        public DateTime Timestamp { get; set; }
    }
}
