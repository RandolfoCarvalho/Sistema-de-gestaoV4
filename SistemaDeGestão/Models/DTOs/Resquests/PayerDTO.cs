namespace SistemaDeGestão.Models.DTOs.Resquests
{
    public class PayerDTO
    {
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public IdentificationDTO Identification { get; set; }
    }

}
