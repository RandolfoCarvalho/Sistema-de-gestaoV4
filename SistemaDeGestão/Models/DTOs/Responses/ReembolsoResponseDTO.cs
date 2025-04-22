namespace SistemaDeGestao.Models.DTOs.Responses
{
    public class ReembolsoResponseDTO
    {
        public long TransactionId { get; set; }
        public decimal Amount { get; set; }
        public string Status { get; set; }
    }
}