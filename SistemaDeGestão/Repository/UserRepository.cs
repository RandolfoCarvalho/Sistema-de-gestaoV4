using SistemaDeGestão.Data;
using SistemaDeGestão.Models;
using System.Security.Cryptography;
using System.Text;

namespace SistemaDeGestão.Repository
{
    public class UserRepository : IUserRepository
    {
        private readonly DataBaseContext _context;

        public UserRepository(DataBaseContext context)
        {
            _context = context;
        }
        public Restaurante ValidateCredentials(Restaurante user)
        {
            // Compute the hash of the password provided by the user
            var pass = ComputeHash(user.Password);

            // Fetch the user from the database where the username and password match
            return _context.Restaurantes.FirstOrDefault(u => (u.UserName == user.UserName) && (u.Password == pass));
        }
        public Restaurante ValidateCredentials(string userName)
        {
            return _context.Restaurantes.SingleOrDefault(u => u.UserName == userName);
        }
        public bool RevokeToken(string userName)
        {
            var user = _context.Restaurantes.SingleOrDefault(u => (u.UserName == userName));
            if (user == null) return false;
            user.refreshToken = null;
            _context.SaveChanges();
            return true;
        }
        private string ComputeHash(string input)
        {
            // Use a using block to ensure the SHA256CryptoServiceProvider is disposed
            using (var algorithm = new SHA256CryptoServiceProvider())
            {
                // Convert input string to bytes and compute the hash
                Byte[] inputBytes = Encoding.UTF8.GetBytes(input);
                Byte[] hashedBytes = algorithm.ComputeHash(inputBytes);

                StringBuilder builder = new StringBuilder();
                foreach (byte b in hashedBytes)
                {
                    builder.Append(b.ToString("x2")); // Use lowercase hex
                }
                return builder.ToString();
            }
        }

        public Restaurante RefreshUserInfo(Restaurante user)
        {
            if (!_context.Restaurantes.Any(u => u.Id.Equals(user.Id))) return null;

            var result = _context.Restaurantes.FirstOrDefault(p => p.Id.Equals(user.Id));
            if (result != null)
            {
                try
                {
                    _context.Entry(result).CurrentValues.SetValues(user);
                    _context.SaveChanges();
                    return result;
                }
                catch (Exception ex)
                {
                    throw new Exception("Erro no refreshUser Info: " + ex.Message);
                }
            }
            return result;
        }

    }
}
