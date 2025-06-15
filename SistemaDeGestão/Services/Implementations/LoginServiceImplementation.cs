using SistemaDeGestao.Areas.Admin.Controllers;
using SistemaDeGestao.Configurations;
using SistemaDeGestao.Data;
using SistemaDeGestao.Models;
using SistemaDeGestao.Models.DTOs.Responses;
using SistemaDeGestao.Repository;
using SistemaDeGestao.Services.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace SistemaDeGestao.Services.Implementations
{
    public class LoginServiceImplementation : ILoginService
    {
        private const string DATE_FORMAT = "yyyy-MM-dd HH:mm:ss";
        private TokenConfiguration _configuration;
        private IUserRepository _userRepository;
        private readonly DataBaseContext _context;
        private readonly ITokenService _tokenService;
        private readonly ILogger<LoginServiceImplementation> _logger;
        public LoginServiceImplementation(ILogger<LoginServiceImplementation> logger, TokenConfiguration configuration,
            IUserRepository userRepository, ITokenService tokenService, 
            DataBaseContext context)
        {
            _configuration = configuration;
            _userRepository = userRepository;
            _tokenService = tokenService;
            _logger = logger;
            _context = context;
        }

        public LoginResultDTO ValidateCredentials(Restaurante userCredentials)
        {
            var user = _userRepository.ValidateCredentials(userCredentials);
            var userFromDb = _context.Restaurantes.FirstOrDefault(u => u.UserName == userCredentials.UserName);
            if (user == null) return null;
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N")),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.UserName),
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
            };

            var accessToken = _tokenService.GenerateAccessToken(claims);
            var refreshToken = _tokenService.GenerateRefreshToken();

            user.refreshToken = refreshToken;
            user.refreshTokenExpiryTime = DateTime.Now.AddDays(_configuration.DaysToExpiry);

            _userRepository.RefreshUserInfo(user);
            DateTime createDate = DateTime.Now;
            DateTime expirationDate = createDate.AddMinutes(_configuration.Minutes);


            var tokenVO = new TokenVO(true, createDate.ToString(DATE_FORMAT), expirationDate.ToString(DATE_FORMAT), accessToken, refreshToken);
            return new LoginResultDTO
            {
                Token = tokenVO,
                UserData = userFromDb 
            };
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
