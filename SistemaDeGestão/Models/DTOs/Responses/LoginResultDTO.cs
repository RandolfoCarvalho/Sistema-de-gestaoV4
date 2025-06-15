using SistemaDeGestao.Data;

namespace SistemaDeGestao.Models.DTOs.Responses
{
    public class LoginResultDTO
    {
        public TokenVO Token { get; set; }
        public Restaurante UserData { get; set; }
    }
}
