using System.ComponentModel.DataAnnotations;

namespace DevAPI.Models.DTOs
{
    public class LoginRequest
    {
        [Required(ErrorMessage = "Email обязателен")]
        [EmailAddress(ErrorMessage = "Неверный формат email")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Пароль обязателен")]
        [MinLength(6, ErrorMessage = "Минимальная длина пароля 6 символов")]
        public string Password { get; set; }
    }
}
