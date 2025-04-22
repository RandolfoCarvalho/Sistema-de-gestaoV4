using SistemaDeGestao.Models;

namespace SistemaDeGestao.Repository
{
    public interface IUserRepository
    {
        Restaurante ValidateCredentials(Restaurante restaurante);
        Restaurante ValidateCredentials(string userName);
        bool RevokeToken(string userName);

        Restaurante RefreshUserInfo(Restaurante restaurante);
    }
}
