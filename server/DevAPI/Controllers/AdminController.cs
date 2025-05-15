using DevAPI.Data;
using DevAPI.Models.DTOs;
using DevAPI.Models.Entities;
using DevAPI.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        private readonly StoreDbContext _context;

        public AdminController(IAdminService adminService, ILogger<AdminController> logger, StoreDbContext context)
        {
            _adminService = adminService;
            _logger = logger;
            _context = context;
        }

        [HttpGet("users")]
        public async Task<ActionResult<List<UserDto>>> GetUsers([FromQuery] string search = null, [FromQuery] string role = null)
        {
            var users = await _adminService.GetUsersAsync(search, role);
            return Ok(users);
        }

        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUserNew(Guid id, [FromBody] UpdateUserRequest request)
        {
            await _adminService.UpdateUserAsync(id, request);
            return Ok(new { message = "Пользователь обновлён" });
        }
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            await _adminService.DeleteUserAsync(id);
            return Ok(new { message = "Пользователь удалён" });
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
        [HttpGet("tags")]
        public async Task<ActionResult<List<TagDto>>> GetTags()
        {
            var tags = await _context.Tags
                .Select(t => new TagDto { Id = t.Id, Name = t.Name })
                .ToListAsync();
            return Ok(tags);
        }

        [HttpPost("tags")]
        public async Task<IActionResult> CreateTag([FromBody] CreateTagRequest request)
        {
            var tag = new Tag { Id = Guid.NewGuid(), Name = request.Name };
            _context.Tags.Add(tag);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Тег создан", tagId = tag.Id });
        }

        [HttpPut("tags/{id}")]
        public async Task<IActionResult> UpdateTag(Guid id, [FromBody] UpdateTagRequest request)
        {
            var tag = await _context.Tags.FindAsync(id);
            if (tag == null)
            {
                return NotFound("Тег не найден");
            }
            tag.Name = request.Name;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Тег обновлён" });
        }

        [HttpDelete("tags/{id}")]
        public async Task<IActionResult> DeleteTag(Guid id)
        {
            var tag = await _context.Tags.FindAsync(id);
            if (tag == null)
            {
                return NotFound("Тег не найден");
            }
            _context.Tags.Remove(tag);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Тег удалён" });
        }

        [HttpGet("action-logs")]
        public async Task<ActionResult<(List<AdminActionLogDto> Logs, int TotalCount)>> GetAdminActionLogs(
            [FromQuery] string actionType = null,
            [FromQuery] string entityType = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var (logs, totalCount) = await _adminService.GetAdminActionLogsAsync(actionType, entityType, startDate, endDate, page, pageSize);
            return Ok(new { Logs = logs, TotalCount = totalCount });
        }
    }
}