using DevAPI.Data;
using DevAPI.Exceptions;
using DevAPI.Models.DTOs;
using DevAPI.Models.Entities;
using DevAPI.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace DevAPI.Services.Implementations
{
    public class AdminService : IAdminService
    {
        private readonly UserManager<User> _userManager;
        private readonly StoreDbContext _context;
        private readonly ILogger<AdminService> _logger;

        public AdminService(UserManager<User> userManager, StoreDbContext context, ILogger<AdminService> logger)
        {
            _userManager = userManager;
            _context = context;
            _logger = logger;
        }

        public async Task<List<UserDto>> GetUsersAsync(string search = null)
        {
            var query = _userManager.Users.AsQueryable();
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(u => u.Email.Contains(search) || u.FirstName.Contains(search) || u.LastName.Contains(search));
            }

            return await query
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Roles = _userManager.GetRolesAsync(u).Result,
                    IsLockedOut = _userManager.IsLockedOutAsync(u).Result
                })
                .ToListAsync();
        }

        public async Task UpdateUserRolesAsync(Guid userId, List<string> roles)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) throw new NotFoundException("Пользователь не найден");

            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRolesAsync(user, roles);

            await LogAdminActionAsync(userId, "UpdateRoles", "User", userId, JsonSerializer.Serialize(new { NewRoles = roles }));
        }

        public async Task BlockUserAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) throw new NotFoundException("Пользователь не найден");

            await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddYears(100));
            await LogAdminActionAsync(userId, "BlockUser", "User", userId, "Пользователь заблокирован");
        }

        public async Task<List<OrderDto>> GetOrdersAsync(string status = null, string userEmail = null)
        {
            var query = _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(o => o.Status == status);
            }
            if (!string.IsNullOrEmpty(userEmail))
            {
                query = query.Where(o => o.User.Email.Contains(userEmail));
            }

            return await query
                .Select(o => new OrderDto
                {
                    Id = o.Id,
                    TotalAmount = o.TotalAmount,
                    DiscountAmount = o.DiscountAmount,
                    Status = o.Status,
                    PaymentStatus = o.PaymentStatus,
                    CreatedAt = o.CreatedAt,
                })
                .ToListAsync();
        }

        public async Task UpdateOrderStatusAsync(Guid orderId, string status, string adminComment = null)
        {
            var order = await _context.Orders.FindAsync(orderId);
            if (order == null) throw new NotFoundException("Заказ не найден");

            order.Status = status;
            order.AdminComment = adminComment;
            await _context.SaveChangesAsync();

            await LogAdminActionAsync(Guid.Empty, "UpdateOrderStatus", "Order", orderId, JsonSerializer.Serialize(new { Status = status, AdminComment = adminComment }));
        }

        public async Task LogAdminActionAsync(Guid adminId, string actionType, string entityType, Guid? entityId, string details)
        {
            var log = new AdminActionLog
            {
                Id = Guid.NewGuid(),
                AdminId = adminId,
                ActionType = actionType,
                EntityType = entityType,
                EntityId = entityId,
                Details = details,
                CreatedAt = DateTime.UtcNow
            };
            _context.AdminActionLogs.Add(log);
            await _context.SaveChangesAsync();
        }
    }
}