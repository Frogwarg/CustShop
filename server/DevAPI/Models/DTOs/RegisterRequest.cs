using System.ComponentModel.DataAnnotations;

namespace DevAPI.Models.DTOs
{
    public class RegisterRequest
    {
        [Required(ErrorMessage = "Email обязателен")]
        [EmailAddress(ErrorMessage = "Неверный формат email")]
        public string Email { get; set; }

        [Required(ErrorMessage = "Пароль обязателен")]
        [MinLength(6, ErrorMessage = "Минимальная длина пароля 6 символов")]
        public string Password { get; set; }

        [Required(ErrorMessage = "Имя обязательно")]
        public string FirstName { get; set; }

        [Required(ErrorMessage = "Фамилия обязательна")]
        public string LastName { get; set; }

        [Required(ErrorMessage = "Телефон обязателен")]
        [Phone(ErrorMessage = "Неверный формат телефона")]
        public string PhoneNumber { get; set; }
    }
}
