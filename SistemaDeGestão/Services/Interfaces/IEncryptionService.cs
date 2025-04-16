using Microsoft.AspNetCore.Mvc;

namespace SistemaDeGestão.Services.Interfaces
{
    public interface IEncryptionService
    {
        string Encrypt(string plainText);
        string Decrypt(string cipherText);
    }
}
