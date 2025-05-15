using Azure.Core;
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
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AdminService(UserManager<User> userManager, StoreDbContext context, ILogger<AdminService> logger, IHttpContextAccessor httpContextAccessor)
        {
            _userManager = userManager;
            _context = context;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<List<UserDto>> GetUsersAsync(string search = null, string role = null)
        {
            var users = await _userManager.Users
                .Include(u => u.UserProfile)
                .Where(u => string.IsNullOrEmpty(search) ||
                           u.Id.ToString().Contains(search) ||
                           u.FirstName.Contains(search) ||
                           u.LastName.Contains(search) ||
                           u.PhoneNumber.Contains(search) ||
                           u.Email.Contains(search) ||
                           (u.UserProfile != null && u.UserProfile.MiddleName.Contains(search)))
                .ToListAsync();

            var userDtos = new List<UserDto>();
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                if (string.IsNullOrEmpty(role) || roles.Contains(role))
                {
                    userDtos.Add(new UserDto
                    {
                        Id = user.Id,
                        Email = user.Email,
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        MiddleName = user.UserProfile?.MiddleName,
                        Bio = user.UserProfile?.Bio,
                        PhoneNumber = user.PhoneNumber,
                        Roles = roles,
                        IsLockedOut = await _userManager.IsLockedOutAsync(user)
                    });
                }
            }

            return userDtos;
        }

        public async Task UpdateUserAsync(Guid userId, UpdateUserRequest request)
        {
            var user = await _userManager.Users
                .Include(u => u.UserProfile)
                .FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) throw new NotFoundException("Пользователь не найден");

            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.PhoneNumber = request.PhoneNumber;

            if (user.UserProfile == null)
            {
                user.UserProfile = new UserProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                };
                _context.UserProfiles.Add(user.UserProfile);
            }
            user.UserProfile.MiddleName = request.MiddleName;
            user.UserProfile.Bio = request.Bio;

            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRolesAsync(user, request.Roles);

            await _userManager.UpdateAsync(user);
            await _context.SaveChangesAsync();
            await LogAdminActionAsync("UpdateUser", "User", userId, request);
        }

        public async Task DeleteUserAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) throw new NotFoundException("Пользователь не найден");

            await _userManager.DeleteAsync(user);
            await LogAdminActionAsync("DeleteUser", "User", userId, "Пользователь удалён");
        }

        public async Task UpdateUserRolesAsync(Guid userId, List<string> roles)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) throw new NotFoundException("Пользователь не найден");

            var currentRoles = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRolesAsync(user, roles);

            await LogAdminActionAsync("UpdateRoles", "User", userId, JsonSerializer.Serialize(new { NewRoles = roles }));
        }

        public async Task BlockUserAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) throw new NotFoundException("Пользователь не найден");

            await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddYears(100));
            await LogAdminActionAsync("BlockUser", "User", userId, "Пользователь заблокирован");
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

            await LogAdminActionAsync("UpdateOrderStatus", "Order", orderId, new { Status = status, AdminComment = adminComment });
        }

        public async Task LogAdminActionAsync(string actionType, string entityType, Guid? entityId, object details)
        {
            var user = await _userManager.GetUserAsync(_httpContextAccessor.HttpContext.User);
            if (user == null)
            {
                _logger.LogWarning("Не удалось определить текущего администратора для логирования действия.");
                return;
            }

            string detailsString;
            if (details is string stringDetails)
            {
                detailsString = stringDetails; // Если передана строка, используем её как есть
            }
            else
            {
                detailsString = JsonSerializer.Serialize(details, new JsonSerializerOptions
                {
                    Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping, // Отключаем кодирование кириллицы
                    WriteIndented = true
                });
            }

            var log = new AdminActionLog
            {
                Id = Guid.NewGuid(),
                AdminId = user.Id,
                ActionType = actionType,
                EntityType = entityType,
                EntityId = entityId,
                Details = detailsString,
                CreatedAt = DateTime.UtcNow
            };
            _context.AdminActionLogs.Add(log);
            await _context.SaveChangesAsync();
        }
        public async Task<(List<AdminActionLogDto> Logs, int TotalCount)> GetAdminActionLogsAsync(string actionType = null, string entityType = null, DateTime? startDate = null, DateTime? endDate = null, int page = 1, int pageSize = 10)
        {
            var query = _context.AdminActionLogs
                .Include(log => log.Admin)
                .AsQueryable();

            if (!string.IsNullOrEmpty(actionType))
            {
                query = query.Where(log => log.ActionType.Contains(actionType));
            }

            if (!string.IsNullOrEmpty(entityType))
            {
                query = query.Where(log => log.EntityType.Contains(entityType));
            }

            if (startDate.HasValue)
            {
                query = query.Where(log => log.CreatedAt >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(log => log.CreatedAt <= endDate.Value);
            }

            var totalCount = await query.CountAsync();
            var logs = await query
                .OrderByDescending(log => log.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(log => new AdminActionLogDto
                {
                    Id = log.Id,
                    AdminId = log.AdminId,
                    AdminName = log.Admin != null ? $"{log.Admin.FirstName} {log.Admin.LastName}" : "Неизвестный",
                    ActionType = log.ActionType,
                    EntityType = log.EntityType,
                    EntityId = log.EntityId,
                    Details = log.Details,
                    CreatedAt = log.CreatedAt
                })
                .ToListAsync();

            return (logs, totalCount);
        }
    }
}