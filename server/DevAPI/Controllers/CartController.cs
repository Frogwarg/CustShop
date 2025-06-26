using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using DevAPI.Services;
using DevAPI.Models.DTOs;
using Azure.Core;

namespace DevAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;
        private readonly ILogger<CartController> _logger;

        public CartController(ICartService cartService, ILogger<CartController> logger)
        {
            _cartService = cartService;
            _logger = logger;
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddToCart([FromBody] CartItemDto request)
        {
            try
            {
                _logger.LogInformation($"Получен запрос на добавление в корзину: {request}");
                _logger.LogInformation($"Пользователь авторизоавн?: {User.Identity.IsAuthenticated}");

                var userId = User.Identity.IsAuthenticated
                ? Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value)
                : (Guid?)null;

                _logger.LogInformation($"UserId: {userId?.ToString() ?? "null"}");

                string sessionId = null;
                if (!userId.HasValue) // Только для неавторизованных пользователей
                {
                    sessionId = HttpContext.Request.Cookies["cart_session_id"];
                    if (string.IsNullOrEmpty(sessionId))
                    {
                        sessionId = Guid.NewGuid().ToString();
                        _logger.LogInformation($"Creating new cart_session_id: {sessionId}");
                        HttpContext.Response.Cookies.Append("cart_session_id", sessionId, new CookieOptions
                        {
                            HttpOnly = true,
                            Expires = DateTime.Now.AddDays(30),
                            SameSite = SameSiteMode.Lax,
                            Secure = false
                        });
                    }
                    _logger.LogInformation($"Generated or retrieved SessionId: {sessionId}");
                }
                else
                {
                    _logger.LogInformation($"Using existing cart_session_id: {sessionId}");
                }
                    await _cartService.AddToCart(userId, sessionId, request);
                return Ok(new { message = "Товар успешно добавлен в корзину" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при добавлении в корзину");
                Console.WriteLine($"Ошибка при добавлении в корзину {ex}");
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost("add-existing")]
        public async Task<IActionResult> AddExistingToCart([FromBody] AddExistingCartItemDto request)
        {
            try
            {
                _logger.LogInformation($"Получен запрос на добавление существующего дизайна в корзину: DesignId={request.DesignId}, Quantity={request.Quantity}, Price={request.Price}");
                _logger.LogInformation($"Пользователь авторизован?: {User.Identity.IsAuthenticated}");

                var userId = User.Identity.IsAuthenticated
                    ? Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value)
                    : (Guid?)null;

                _logger.LogInformation($"UserId: {userId?.ToString() ?? "null"}");

                string sessionId = null;
                if (!userId.HasValue) // Только для неавторизованных пользователей
                {
                    sessionId = HttpContext.Request.Cookies["cart_session_id"];
                    if (string.IsNullOrEmpty(sessionId))
                    {
                        sessionId = Guid.NewGuid().ToString();
                        _logger.LogInformation($"Creating new cart_session_id: {sessionId}");
                        HttpContext.Response.Cookies.Append("cart_session_id", sessionId, new CookieOptions
                        {
                            HttpOnly = true,
                            Expires = DateTime.Now.AddDays(30),
                            SameSite = SameSiteMode.Lax,
                            Secure = false
                        });
                    }
                    _logger.LogInformation($"Generated or retrieved SessionId: {sessionId}");
                }

                await _cartService.AddExistingToCart(userId, sessionId, request.DesignId, request.Quantity, request.Price);
                return Ok(new { message = "Товар успешно добавлен в корзину" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при добавлении существующего дизайна в корзину");
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet]
        public async Task<ActionResult<List<CartItemDto>>> GetCart()
        {
            _logger.LogInformation($"Пользователь авторизоавн?: {User.Identity.IsAuthenticated}");
            var userId = User.Identity.IsAuthenticated ? 
                Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value) : 
                (Guid?)null;

            var sessionId = userId.HasValue
                ? null
                : HttpContext.Request.Cookies["cart_session_id"]
                ?? HttpContext.Request.Headers["X-Session-Id"].FirstOrDefault();

            var cart = await _cartService.GetCart(userId, sessionId);
            return Ok(cart);
        }

        [HttpDelete("{designId}")]
        public async Task<IActionResult> RemoveFromCart(Guid designId)
        {
            try
            {
                var userId = User.Identity.IsAuthenticated ?
                    Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value) :
                    (Guid?)null;

                var sessionId = userId.HasValue ?
                    null :
                    HttpContext.Request.Cookies["cart_session_id"];

                await _cartService.RemoveFromCart(userId, sessionId, designId);
                return Ok(new { message = "Товар успешно удален из корзины" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при удалении товара из корзины");
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPut("{designId}")]
        public async Task<IActionResult> UpdateQuantity(Guid designId, [FromBody] int quantity)
        {
            var userId = User.Identity.IsAuthenticated ? 
                Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value) : 
                (Guid?)null;
            
            var sessionId = userId.HasValue ? 
                null :
                HttpContext.Request.Cookies["cart_session_id"];

            await _cartService.UpdateQuantity(userId, sessionId, designId, quantity);
            return Ok();
        }

        [HttpPut("update/{designId}")]
        public async Task<IActionResult> UpdateCartItem(Guid designId, [FromBody] CartItemDto request)
        {
            try
            {
                var userId = User.Identity.IsAuthenticated
                    ? Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value)
                    : (Guid?)null;

                var sessionId = userId.HasValue
                    ? null
                    : HttpContext.Request.Cookies["cart_session_id"];

                await _cartService.UpdateCartItem(userId, sessionId, designId, request);
                return Ok(new { message = "Дизайн успешно обновлен" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обновлении дизайна в корзине");
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost("merge")]
        [Authorize]
        public async Task<IActionResult> MergeAnonymousCart()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var sessionId = HttpContext.Request.Cookies["cart_session_id"];

            if (!string.IsNullOrEmpty(sessionId))
            {
                await _cartService.MergeAnonymousCart(userId, sessionId);
                HttpContext.Response.Cookies.Delete("cart_session_id"); // Очищаем куки после слияния
            }

            return Ok();
        }
    }
    public class AddExistingCartItemDto
    {
        public Guid DesignId { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
    }
} 