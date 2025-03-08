using DevAPI.Exceptions;
using DevAPI.Models.DTOs;
using DevAPI.Services.Interfaces;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace DevAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponse>> Login([FromBody] DevAPI.Models.DTOs.LoginRequest request)
        {
            try
            {
                var result = await _authService.LoginAsync(request);
                return Ok(result);
            }
            catch (UnauthorizedException)
            {
                return Unauthorized();
            }
        }
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            // Очистка куки cart_session_id
            HttpContext.Response.Cookies.Delete("cart_session_id");

            // Выход из авторизации (например, если используете Identity)
            //await HttpContext.SignOutAsync();

            return Ok(new { message = "Выход выполнен" });
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponse>> Register([FromBody] DevAPI.Models.DTOs.RegisterRequest request)
        {
            _logger.LogInformation($"Получен запрос на регистрацию для email: {request.Email}");
            try
            {
                _logger.LogInformation($"Данные запроса: {JsonSerializer.Serialize(request)}");
                var result = await _authService.RegisterAsync(request);
                return Ok(result);
            }
            catch (BadRequestException ex)
            {
                _logger.LogWarning($"Ошибка при регистрации: {ex.Message}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Необработанная ошибка при регистрации: {ex}");
                return StatusCode(500, new { message = "Внутренняя ошибка сервера" });
            }
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] string email)
        {
            await _authService.ForgotPasswordAsync(email);
            return Ok();
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] Models.DTOs.ResetPasswordRequest request)
        {
            try
            {
                await _authService.ResetPasswordAsync(request.Email, request.Token, request.NewPassword);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
