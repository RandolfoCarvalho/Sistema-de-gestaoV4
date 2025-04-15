using SistemaDeGestão.Data;
using SistemaDeGestão.Models;

namespace SistemaDeGestão.Services.Interfaces
{
    public interface ILoginService
    {
        TokenVO ValidateCredentials(Restaurante user);
        TokenVO ValidateCredentials(TokenVO token);
        bool RevokeToken(string userName);
    }
}
