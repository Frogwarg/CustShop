using DevAPI.Models.DTOs;
using DevAPI.Models.Entities;
using DevAPI.Services.Interfaces;
using DevAPI.Exceptions;
using Microsoft.AspNetCore.Identity;
using System.Net;
using System.Security.Cryptography;


namespace DevAPI.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<User> _userManager;
        private readonly IConfiguration _configuration;
        private readonly ITokenService _tokenService;
        private readonly IEmailService _emailService;
        private readonly ICartService _cartService;
        private readonly ILogger<AuthService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuthService(
            UserManager<User> userManager,
            IConfiguration configuration,
            ITokenService tokenService,
            IEmailService emailService,
            ICartService cartService,
            ILogger<AuthService> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _userManager = userManager;
            _configuration = configuration;
            _tokenService = tokenService;
            _emailService = emailService;
            _cartService = cartService;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
            {
                throw new UnauthorizedException("Недействительные учетные данные");
            }

            var roles = await _userManager.GetRolesAsync(user);
            var token = _tokenService.GenerateJwtToken(user, roles);
            var refreshToken = _tokenService.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _userManager.UpdateAsync(user);

            var sessionId = _httpContextAccessor.HttpContext?.Request.Cookies["cart_session_id"];
            if (!string.IsNullOrEmpty(sessionId))
            {
                await _cartService.MergeAnonymousCart(user.Id, sessionId);
                _httpContextAccessor.HttpContext?.Response.Cookies.Delete("cart_session_id");
            }

            return new AuthResponse
            {
                Token = token,
                RefreshToken = refreshToken,
                Expiration = DateTime.UtcNow.AddHours(1)
            };
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
        {
            _logger.LogInformation($"Получен запрос на регистрацию для email: {request.Email}");
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                throw new BadRequestException("Пользователь уже существует");
            }

            var refreshToken = _tokenService.GenerateRefreshToken();

            var user = new User
            {
                UserName = request.Email,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber,
                RegistrationDate = DateTime.UtcNow,
                RefreshToken = refreshToken,
                RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7)
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                throw new BadRequestException(string.Join(", ", result.Errors.Select(e => e.Description)));
            }

            await _userManager.AddToRoleAsync(user, "User");

            var sessionId = _httpContextAccessor.HttpContext?.Request.Cookies["cart_session_id"];
            if (!string.IsNullOrEmpty(sessionId))
            {
                await _cartService.MergeAnonymousCart(user.Id, sessionId);
                _httpContextAccessor.HttpContext?.Response.Cookies.Delete("cart_session_id");
            }

            return await LoginAsync(new LoginRequest { Email = request.Email, Password = request.Password });
        }

        public async Task<bool> ForgotPasswordAsync(string email)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                // Возвращаем true даже если пользователь не найден, 
                // чтобы не раскрывать информацию о существовании email
                return true;
            }

            // Генерируем токен для сброса пароля
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);

            // Создаём ссылку для сброса пароля
            var resetLink = $"{_configuration["AppUrl"]}/reset-password?email={email}&token={WebUtility.UrlEncode(token)}";

            // Отправляем email
            await _emailService.SendEmailAsync(
                email,
                "Сброс пароля",
                $"Для сброса пароля перейдите по ссылке: {resetLink}"
            );

            return true;
        }

        public async Task<bool> ResetPasswordAsync(string email, string token, string newPassword)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                throw new NotFoundException("Пользователь не найден");
            }

            var result = await _userManager.ResetPasswordAsync(user, token, newPassword);
            if (!result.Succeeded)
            {
                throw new BadRequestException(string.Join(", ", result.Errors.Select(e => e.Description)));
            }

            // Сбрасываем refresh token при смене пароля
            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = DateTime.MinValue;
            await _userManager.UpdateAsync(user);

            return true;
        }
    }
}
