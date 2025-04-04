using Microsoft.AspNetCore.Identity.Data;
using DevAPI.Models.DTOs;


namespace DevAPI.Services.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponse> LoginAsync(Models.DTOs.LoginRequest request);
        Task<AuthResponse> RegisterAsync(Models.DTOs.RegisterRequest request);
        Task<bool> ForgotPasswordAsync(string email);
        Task<bool> ResetPasswordAsync(string email, string token, string newPassword);
        Task<AuthResponse> RefreshTokenAsync(string refreshToken);
    }
}
