using SistemaDeGestão.Areas.Admin.Controllers;
using SistemaDeGestão.Configurations;
using SistemaDeGestão.Data;
using SistemaDeGestão.Models;
using SistemaDeGestão.Repository;
using SistemaDeGestão.Services.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace SistemaDeGestão.Services.Implementations
{
    public class LoginServiceImplementation : ILoginService
    {
        private const string DATE_FORMAT = "yyyy-MM-dd HH:mm:ss";
        private TokenConfiguration _configuration;
        private IUserRepository _userRepository;
        private readonly ITokenService _tokenService;
        private readonly ILogger<AuthController> _logger;
        public LoginServiceImplementation(ILogger<AuthController> logger, TokenConfiguration configuration, IUserRepository userRepository, ITokenService tokenService)
        {
            _configuration = configuration;
            _userRepository = userRepository;
            _tokenService = tokenService;
            _logger = logger;
        }

        public TokenVO ValidateCredentials(Restaurante userCredentials)
        {
            var user = _userRepository.ValidateCredentials(userCredentials);
            if (user == null) return null;
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.UserName),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
            };

            var accessToken = _tokenService.GenerateAccessToken(claims);
            var refreshToken = _tokenService.GenerateRefreshToken();

            user.refreshToken = refreshToken;
            user.refreshTokenExpiryTime = DateTime.Now.AddDays(_configuration.DaysToExpiry);

            _userRepository.RefreshUserInfo(user);
            DateTime createDate = DateTime.Now;
            DateTime expirationDate = createDate.AddMinutes(_configuration.Minutes);



            return new TokenVO(
                   true,
                   createDate.ToString(DATE_FORMAT),
                   expirationDate.ToString(DATE_FORMAT),
                   accessToken,
                   refreshToken
                );
        }
        public TokenVO ValidateCredentials(TokenVO token)
        {
            var accessToken = token.AccessToken;
            var refreshToken = token.RefreshToken;

            var principal = _tokenService.GetPrincipalFromExpiredToken(accessToken);

            var username = principal.Identity.Name;

            var user = _userRepository.ValidateCredentials(username);

            if (user == null ||
                user.refreshToken != refreshToken ||
                user.refreshTokenExpiryTime <= DateTime.Now) return null;

            accessToken = _tokenService.GenerateAccessToken(principal.Claims);
            refreshToken = _tokenService.GenerateRefreshToken();

            user.refreshToken = refreshToken;

            _userRepository.RefreshUserInfo(user);

            DateTime createDate = DateTime.Now;
            DateTime expirationDate = createDate.AddMinutes(_configuration.Minutes);

            return new TokenVO(
                true,
                createDate.ToString(DATE_FORMAT),
                expirationDate.ToString(DATE_FORMAT),
                accessToken,
                refreshToken
                );
        }
        public bool RevokeToken(string userName)
        {
            return _userRepository.RevokeToken(userName);
        }
    }
}
