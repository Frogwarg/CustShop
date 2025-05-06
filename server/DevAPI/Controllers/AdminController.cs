using DevAPI.Models.DTOs;
using DevAPI.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace DevAPI.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly ILogger<AdminController> _logger;

        public AdminController(IAdminService adminService, ILogger<AdminController> logger)
        {
            _adminService = adminService;
            _logger = logger;
        }

        [HttpGet("users")]
        public async Task<ActionResult<List<UserDto>>> GetUsers([FromQuery] string search = null)
        {
            var users = await _adminService.GetUsersAsync(search);
            return Ok(users);
        }

        [HttpPut("users/{id}/roles")]
        public async Task<IActionResult> UpdateUserRoles(Guid id, [FromBody] List<string> roles)
        {
            await _adminService.UpdateUserRolesAsync(id, roles);
            return Ok(new { message = "Роли обновлены" });
        }

        [HttpPost("users/{id}/block")]
        public async Task<IActionResult> BlockUser(Guid id)
        {
            await _adminService.BlockUserAsync(id);
            return Ok(new { message = "Пользователь заблокирован" });
        }

        [HttpGet("orders")]
        public async Task<ActionResult<List<OrderDto>>> GetOrders([FromQuery] string status = null, [FromQuery] string userEmail = null)
        {
            var orders = await _adminService.GetOrdersAsync(status, userEmail);
            return Ok(orders);
        }

        [HttpPut("orders/{id}/status")]
        public async Task<IActionResult> UpdateOrderStatus(Guid id, [FromBody] UpdateOrderStatusRequest request)
        {
            await _adminService.UpdateOrderStatusAsync(id, request.Status, request.AdminComment);
            return Ok(new { message = "Статус заказа обновлен" });
        }
    }
}