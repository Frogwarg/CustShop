using DevAPI.Data;
using DevAPI.Exceptions;
using DevAPI.Models.DTOs;
using DevAPI.Models.Entities;
using DevAPI.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
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
        [HttpGet("tags")]
        public async Task<ActionResult<(List<TagDto> Tags, int TotalCount)>> GetTags([FromQuery] string search = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var (tags, totalCount) = await _adminService.GetTagsAsync(search, page, pageSize); 
            return Ok(new { Tags = tags, TotalCount = totalCount });
        }

        [HttpPost("tags")]
        public async Task<IActionResult> CreateTag([FromBody] CreateTagRequest request)
        {
            try
            {
                await _adminService.CreateTagAsync(request.Name);
                return Ok(new { message = "Тег создан" });
            }
            catch (BadRequestException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при создании тега");
                return StatusCode(500, new { message = "Ошибка сервера при создании тега" });
            }
        }

        [HttpPut("tags/{id}")]
        public async Task<IActionResult> UpdateTag(Guid id, [FromBody] UpdateTagRequest request)
        {
            try
            {
                await _adminService.UpdateTagAsync(id, request.Name);
                return Ok(new { message = "Тег обновлён" });
            }
            catch (BadRequestException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обновлении тега");
                return StatusCode(500, new { message = "Ошибка сервера при обновлении тега" });
            }
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

        [HttpGet("users")]
        public async Task<ActionResult<(List<UserDto> Users, int TotalCount)>> GetUsers([FromQuery] string search = null, [FromQuery] string role = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var (users, totalCount) = await _adminService.GetUsersAsync(search, role, page, pageSize); 
            return Ok(new { Users = users, TotalCount = totalCount });
        }

        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
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
        
        [HttpGet("designs")]
        public async Task<ActionResult<(List<AdminDesignDto> Designs, int TotalCount)>> GetDesigns(
            [FromQuery] string search = null,
            [FromQuery] string moderationStatus = null,
            [FromQuery] Guid? userId = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var (designs, totalCount) = await _adminService.GetDesignsAsync(search, moderationStatus, userId, page, pageSize);
            return Ok(new { Designs = designs, TotalCount = totalCount });
        }

        [HttpPut("designs/{id}")]
        public async Task<IActionResult> UpdateDesign(Guid id, [FromBody] UpdateDesignRequest request)
        {
            await _adminService.UpdateDesignAsync(id, request);
            return Ok(new { message = "Дизайн обновлён" });
        }

        [HttpDelete("designs/{id}")]
        public async Task<IActionResult> DeleteDesign(Guid id)
        {
            await _adminService.DeleteDesignAsync(id);
            return Ok(new { message = "Дизайн удалён" });
        }

        [HttpGet("orders")]
        public async Task<ActionResult<(List<AdminOrderDto> Orders, int TotalCount)>> GetOrders(
            [FromQuery] string search = null,
            [FromQuery] string status = null,
            [FromQuery] string paymentStatus = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string customerName = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var (orders, totalCount) = await _adminService.GetOrdersAsync(
                search, status, paymentStatus, startDate, endDate, customerName, page, pageSize);
            return Ok(new { Orders = orders, TotalCount = totalCount });
        }

        [HttpPut("orders/{id}/status")]
        public async Task<IActionResult> UpdateOrderStatus(Guid id, [FromBody] DevAPI.Models.DTOs.UpdateOrderStatusRequest request)
        {
            await _adminService.UpdateOrderStatusAsync(id, request.Status, request.PaymentStatus, request.AdminComment);
            return Ok(new { message = "Статус заказа обновлен" });
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