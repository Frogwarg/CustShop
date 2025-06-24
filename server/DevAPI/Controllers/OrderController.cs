using DevAPI.Models.DTOs;
using DevAPI.Models.Entities;
using DevAPI.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DevAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrderController : ControllerBase
    {
        private readonly IOrderService _orderService;
        private readonly ILogger<OrderController> _logger;

        public OrderController(IOrderService orderService, ILogger<OrderController> logger)
        {
            _orderService = orderService;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto request)
        {
            try
            {
                var userId = User.Identity.IsAuthenticated
                    ? Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value)
                    : (Guid?)null;
                var sessionId = userId.HasValue
                    ? null
                    : HttpContext.Request.Cookies["cart_session_id"];

                var order = await _orderService.CreateOrderAsync(userId, sessionId, request);
                return Ok(order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при создании заказа");
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet("{orderId}")]
        public async Task<IActionResult> GetOrder(Guid orderId)
        {
            try
            {
                var userId = User.Identity.IsAuthenticated
                    ? Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value)
                    : (Guid?)null;
                var order = await _orderService.GetOrderAsync(orderId, userId);
                return Ok(order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении заказа");
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet("paid")]
        [Authorize(Roles = "Moderator,Admin")]
        public async Task<IActionResult> GetPaidOrders()
        {
            try
            {
                var orders = await _orderService.GetPaidOrdersAsync();
                return Ok(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении оплаченных заказов");
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPut("{orderId}/status")]
        [Authorize(Roles = "Moderator,Admin")]
        public async Task<IActionResult> UpdateOrderStatus(Guid orderId, [FromBody] UpdateOrderStatusRequest request)
        {
            try
            {
                var order = await _orderService.UpdateOrderStatusAsync(orderId, request.Status, request.Address);
                return Ok(order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обновлении статуса заказа");
                return StatusCode(500, ex.Message);
            }
        }
    }

    public class UpdateOrderStatusRequest
    {
        public string Status { get; set; }
        public AddressDto? Address { get; set; }
    }
}
