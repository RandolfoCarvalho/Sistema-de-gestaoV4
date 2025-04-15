using SistemaDeGestão.Models;

namespace SistemaDeGestão.Repository
{
    public interface IUserRepository
    {
        Restaurante ValidateCredentials(Restaurante restaurante);
        Restaurante ValidateCredentials(string userName);
        bool RevokeToken(string userName);

        Restaurante RefreshUserInfo(Restaurante restaurante);
    }
}
