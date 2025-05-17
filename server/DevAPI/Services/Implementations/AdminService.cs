using DevAPI.Data;
using DevAPI.Exceptions;
using DevAPI.Models.DTOs;
using DevAPI.Models.Entities;
using DevAPI.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Text.Json;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

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

        public async Task<(List<TagDto> Tags, int TotalCount)> GetTagsAsync(string search = null, int page = 1, int pageSize = 10)
        {
            var query = _context.Tags.AsQueryable();
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(t => t.Name.ToLower().Contains(search.ToLower()));
            }
            var totalCount = await query.CountAsync();
            var tags = await query
                .OrderBy(t => t.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new TagDto
                {
                    Id = t.Id,
                    Name = t.Name
                })
                .ToListAsync();
            return (tags, totalCount);
        }

        public async Task<(List<UserDto> Users, int TotalCount)> GetUsersAsync(string search = null, string role = null, int page = 1, int pageSize = 10)
        {
            var query = _userManager.Users.Include(u => u.UserProfile).AsQueryable();
            if (!string.IsNullOrEmpty(search))
            {
                string lowSearch = search.ToLower();
                query = query.Where(u =>
                    u.Id.ToString().Contains(lowSearch) ||
                    u.FirstName.ToLower().Contains(lowSearch) ||
                    u.LastName.ToLower().Contains(lowSearch) ||
                    u.PhoneNumber.ToLower().Contains(lowSearch) ||
                    u.Email.ToLower().Contains(lowSearch) ||
                    (u.UserProfile != null && u.UserProfile.MiddleName.ToLower().Contains(lowSearch)));
            }

            var totalCount = await query.CountAsync();
            var users = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
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

            return (userDtos, totalCount);
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

        public async Task<(List<AdminDesignDto> Designs, int TotalCount)> GetDesignsAsync(string search = null, string moderationStatus = null, Guid? userId = null, int page = 1, int pageSize = 10)
        {
            var query = _context.Designs
                .Include(d => d.User)
                .Include(d => d.DesignType)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(d => d.Name.ToLower().Contains(search.ToLower()) || d.Description.ToLower().Contains(search.ToLower()));
            }

            if (!string.IsNullOrEmpty(moderationStatus))
            {
                query = query.Where(d => d.ModerationStatus == moderationStatus);
            }

            if (userId.HasValue)
            {
                query = query.Where(d => d.UserId == userId.Value);
            }

            var totalCount = await query.CountAsync();
            var designs = await query
                .OrderByDescending(d => d.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(d => new AdminDesignDto
                {
                    Id = d.Id,
                    UserId = d.UserId,
                    UserName = d.User != null ? $"{d.User.FirstName} {d.User.LastName}" : "Неизвестный",
                    Name = d.Name,
                    Description = d.Description,
                    ProductType = d.ProductType,
                    PreviewUrl = d.PreviewUrl,
                    CreatedAt = d.CreatedAt,
                    ModerationStatus = d.ModerationStatus,
                    ModeratorComment = d.ModeratorComment
                })
                .ToListAsync();

            return (designs, totalCount);
        }

        public async Task UpdateDesignAsync(Guid designId, UpdateDesignRequest request)
        {
            var design = await _context.Designs.FindAsync(designId);
            if (design == null) throw new NotFoundException("Дизайн не найден");

            design.Name = request.Name;
            design.Description = request.Description;
            design.ModerationStatus = request.ModerationStatus;
            design.ModeratorComment = request.ModeratorComment;

            if (design.ModerationStatus == "Approved")
            {
                var catalogItem = await _context.CatalogItems.FirstOrDefaultAsync(x => x.DesignId == designId);
                if (catalogItem != null)
                {
                    _logger.LogInformation("Дизайн привязан к предмету каталога");
                    catalogItem.Name = request.Name;
                    catalogItem.Description = request.Description;
                }
            }

            await _context.SaveChangesAsync();
            await LogAdminActionAsync("UpdateDesign", "Design", designId, new { request.Name, request.Description, request.ModerationStatus, request.ModeratorComment });
        }

        public async Task DeleteDesignAsync(Guid designId)
        {
            var design = await _context.Designs.FindAsync(designId);
            if (design == null) throw new NotFoundException("Дизайн не найден");

            _context.Designs.Remove(design);
            await _context.SaveChangesAsync();
            await LogAdminActionAsync("DeleteDesign", "Design", designId, "Дизайн удалён");
        }

        public async Task<(List<AdminOrderDto> Orders, int TotalCount)> GetOrdersAsync(
            string search = null,
            string status = null,
            string paymentStatus = null,
            DateTime? startDate = null,
            DateTime? endDate = null,
            string customerName = null,
            int page = 1,
            int pageSize = 10)
        {
            var query = _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Design)
                .Include(o => o.Address)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                if (decimal.TryParse(search, out var amount))
                {
                    query = query.Where(o => o.TotalAmount == amount);
                }
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(o => o.Status == status);
            }

            if (!string.IsNullOrEmpty(paymentStatus))
            {
                query = query.Where(o => o.PaymentStatus == paymentStatus);
            }

            if (startDate.HasValue)
            {
                query = query.Where(o => o.CreatedAt >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(o => o.CreatedAt <= endDate.Value);
            }

            if (!string.IsNullOrEmpty(customerName))
            {
                query = query.Where(o =>
                    (o.FirstName + " " + o.LastName).Contains(customerName) ||
                    (o.LastName + " " + o.FirstName).Contains(customerName));
            }

            var totalCount = await query.CountAsync();
            var orders = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(o => new AdminOrderDto
                {
                    Id = o.Id,
                    TotalAmount = o.TotalAmount,
                    Status = o.Status,
                    PaymentStatus = o.PaymentStatus,
                    DeliveryMethod = o.DeliveryMethod,
                    CreatedAt = o.CreatedAt,
                    OrderComment = o.OrderComment,
                    AdminComment = o.AdminComment,
                    FirstName = o.FirstName,
                    LastName = o.LastName,
                    MiddleName = o.MiddleName,
                    Email = o.Email,
                    PhoneNumber = o.PhoneNumber,
                    Address = new AddressDto
                    {
                        Id = o.Address.Id.ToString(),
                        Street = o.Address.Street,
                        City = o.Address.City,
                        State = o.Address.State,
                        PostalCode = o.Address.PostalCode,
                        Country = o.Address.Country
                    },
                    OrderItems = o.OrderItems.Select(oi => new OrderItemDto
                    {
                        DesignId = oi.DesignId,
                        DesignName = oi.Design.Name,
                        Quantity = oi.Quantity,
                        UnitPrice = oi.UnitPrice,
                        PreviewUrl = oi.Design.PreviewUrl
                    }).ToList()
                })
                .ToListAsync();

            return (orders, totalCount);
        }

        public async Task UpdateOrderStatusAsync(Guid orderId, string status, string paymentStatus, string adminComment = null)
        {
            var order = await _context.Orders.FindAsync(orderId);
            if (order == null) throw new NotFoundException("Заказ не найден");

            order.Status = status;
            order.PaymentStatus = paymentStatus;
            order.AdminComment = adminComment;
            await _context.SaveChangesAsync();

            await LogAdminActionAsync("UpdateOrderStatus", "Order", orderId, new { Status = status, PaymentStatus = paymentStatus, AdminComment = adminComment });
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