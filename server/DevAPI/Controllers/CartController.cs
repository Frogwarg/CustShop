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
                Console.WriteLine($"Получен запрос на добавление в корзину: {request}");

                string sessionId = HttpContext.Request.Cookies["cart_session_id"];
                if (string.IsNullOrEmpty(sessionId))
                {
                    sessionId = Guid.NewGuid().ToString();
                    HttpContext.Response.Cookies.Append("cart_session_id", sessionId, new CookieOptions
                    {
                        HttpOnly = true,
                        Expires = DateTime.Now.AddDays(30)
                    });
                }

                var userId = User.Identity.IsAuthenticated ?
                    Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value) : (Guid?)null;

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

        [HttpGet]
        public async Task<ActionResult<List<CartItemDto>>> GetCart()
        {
            var userId = User.Identity.IsAuthenticated ? 
                Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value) : 
                (Guid?)null;
            
            var sessionId = userId.HasValue ? 
                null : 
                HttpContext.Session.Id;

            var cart = await _cartService.GetCart(userId, sessionId);
            return Ok(cart);
        }

        [HttpDelete("{designId}")]
        public async Task<IActionResult> RemoveFromCart(Guid designId)
        {
            var userId = User.Identity.IsAuthenticated ? 
                Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value) : 
                (Guid?)null;
            
            var sessionId = userId.HasValue ? 
                null : 
                HttpContext.Session.Id;

            await _cartService.RemoveFromCart(userId, sessionId, designId);
            return Ok();
        }

        [HttpPut("{designId}")]
        public async Task<IActionResult> UpdateQuantity(Guid designId, [FromBody] int quantity)
        {
            var userId = User.Identity.IsAuthenticated ? 
                Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value) : 
                (Guid?)null;
            
            var sessionId = userId.HasValue ? 
                null : 
                HttpContext.Session.Id;

            await _cartService.UpdateQuantity(userId, sessionId, designId, quantity);
            return Ok();
        }

        [HttpPost("merge")]
        [Authorize]
        public async Task<IActionResult> MergeAnonymousCart()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var sessionId = HttpContext.Session.Id;

            await _cartService.MergeAnonymousCart(userId, sessionId);
            return Ok();
        }
    }
} 