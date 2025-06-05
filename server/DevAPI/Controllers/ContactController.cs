using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using DevAPI.Services.Interfaces;

namespace DevAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContactController : ControllerBase
    {
        private readonly IEmailService _emailService;
        public ContactController(IEmailService emailService)
        {
            _emailService = emailService;
        }

        [HttpPost]
        public async Task<IActionResult> SubmitContactForm([FromBody] ContactRequest request)
        {
            // Сохранение в БД или отправка email
            await _emailService.SendEmailAsync("andronatii11@gmail.com", "Новое сообщение", $"Имя: {request.Name}\nEmail: {request.Email}\nСообщение: {request.Message}");
            return Ok();
        }
        public class ContactRequest
        {
            public string Name { get; set; }
            public string Email { get; set; }
            public string Message { get; set; }
        }
    }
}
