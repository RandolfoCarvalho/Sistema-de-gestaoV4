using SistemaDeGestao.Data;
using SistemaDeGestao.Models;
using SistemaDeGestao.Models.DTOs.Responses;

namespace SistemaDeGestao.Services.Interfaces
{
    public interface ILoginService
    {
        LoginResultDTO ValidateCredentials(Restaurante user);
        TokenVO ValidateCredentials(TokenVO token);
        bool RevokeToken(string userName);
    }
}
