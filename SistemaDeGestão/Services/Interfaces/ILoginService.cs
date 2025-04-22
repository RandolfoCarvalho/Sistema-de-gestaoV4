using SistemaDeGestao.Data;
using SistemaDeGestao.Models;

namespace SistemaDeGestao.Services.Interfaces
{
    public interface ILoginService
    {
        TokenVO ValidateCredentials(Restaurante user);
        TokenVO ValidateCredentials(TokenVO token);
        bool RevokeToken(string userName);
    }
}
