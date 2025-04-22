using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SistemaDeGestao.Data;
using SistemaDeGestao.Models;
using SistemaDeGestao.Services.Interfaces;

namespace SistemaDeGestao.Areas.Admin.Controllers
{
    [Route("api/1.0/[controller]")]
    [Area("Admin")]
    public class AuthController : Controller
    {
        private ILoginService _loginService;
        private readonly ILogger<AuthController> _logger;
        public AuthController(ILogger<AuthController> logger, ILoginService loginService)
        {
            _loginService = loginService;
            _logger = logger;
        }

        [HttpPost]
        [Route("Login")]
        public IActionResult Login([FromBody] Restaurante user)
        {
            if (user == null)
            {
                return BadRequest("User nao autorizado");
            }
            if (ModelState.IsValid)
            {
                var token = _loginService.ValidateCredentials(user);
                if (token != null)
                {
                    return Ok(new { token = token.AccessToken });
                }
            }
            return Unauthorized(new { message = "Credenciais inválidas." });
        }
        [HttpGet]
        [Route("validateToken")]
        [Authorize]
        public IActionResult ValidateToken()
        {
            return Ok(new { valid = true, user = User.Identity.Name });
        }

        [HttpPost]
        [Route("signin")]
        public IActionResult Signin([FromBody] Restaurante user)
        {
            if (user == null) return BadRequest("Invalid request");
            var token = _loginService.ValidateCredentials(user);
            if (token == null) return BadRequest("Invalid request");
            return Ok(token);
        }
        [HttpPost]
        [Route("refresh")]
        public IActionResult Refresh([FromBody] TokenVO tokenVO)
        {
            if (tokenVO == null)
                return BadRequest("Request Invalido: Token VO NULL");
            if (string.IsNullOrEmpty(tokenVO.AccessToken) || string.IsNullOrEmpty(tokenVO.RefreshToken))
                return BadRequest("Invalid request: AccessToken or RefreshToken is missing");

            var token = _loginService.ValidateCredentials(tokenVO);
            if (token == null)
                return BadRequest("Bad request: Unable to validate tokens or tokens expired");

            return Ok(token);
        }
        [HttpGet]
        [Route("revoke")]
        public IActionResult Revoke()
        {
            if (!User.Identity.IsAuthenticated)
            {
                return RedirectToAction("Login", "Account");
            }

            var username = User.Identity.Name;
            var result = _loginService.RevokeToken(username);

            if (!result) return BadRequest("Invalid client request");
            Response.Cookies.Delete("AuthToken");
            return RedirectToAction("Login");
        }
    }
}
