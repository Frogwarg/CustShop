using DevAPI.Models.DTOs;
using DevAPI.Models.Entities;
using DevAPI.Services.Interfaces;
using Google;
using DevAPI.Data;
using Microsoft.EntityFrameworkCore;
using DevAPI.Exceptions;
using Microsoft.AspNetCore.Identity;
using DevAPI.Data.Seeders;

namespace DevAPI.Services.Implementations
{
    public class DesignService : IDesignService
    {
        private readonly StoreDbContext _context;
        private readonly ILogger<DesignService> _logger;
        private readonly UserManager<User> _userManager;

        public DesignService(StoreDbContext context, ILogger<DesignService> logger, UserManager<User> userManager)
        {
            _context = context;
            _logger = logger;
            _userManager = userManager;
        }

        public async Task<DesignDto?> GetDesignById(Guid designId, Guid? userId, string sessionId)
        {
            var design = await _context.Designs
                .Include(d => d.DesignType)
                .Where(d => d.Id == designId)
                .Select(d => new DesignDto
                {
                    Id = d.Id,
                    Name = d.Name,
                    Description = d.Description,
                    PreviewUrl = d.PreviewUrl,
                    DesignData = d.DesignData,
                    DesignHash = d.DesignHash,
                    ProductType = d.ProductType,
                    DesignType = d.DesignType.Name,
                    UserId = d.UserId.ToString(),
                    ModerationStatus = d.ModerationStatus
                })
                .FirstOrDefaultAsync();

            if (design == null)
            {
                _logger.LogWarning($"Дизайн с ID {designId} не найден");
                return null;
            }

            // Публичные дизайны (Approved) доступны всем
            if (design.ModerationStatus == "Approved")
            {
                _logger.LogInformation($"Публичный дизайн {designId} возвращён пользователю {userId?.ToString() ?? "неавторизованному"}");
                return design;
            }

            // Для непубличных дизайнов проверяем, является ли пользователь автором или имеет дизайн в корзине
            if (userId.HasValue)
            {
                var isOwnerOrInCart = await _context.Designs
                    .AnyAsync(d => d.Id == designId &&
                                  (d.UserId == userId || d.CartItems.Any(ci => ci.UserId == userId)));

                var user = _userManager.Users.FirstOrDefault(u => u.Id == userId);
                var roles = await _userManager.GetRolesAsync(user);

                if (!isOwnerOrInCart && !roles.Contains("Admin"))
                {
                    _logger.LogWarning($"Дизайн {designId} не принадлежит пользователю {userId} и не находится в его корзине");
                    return null;
                }
            }
            else if (!string.IsNullOrEmpty(sessionId))
            {
                var isInCart = await _context.CartItems
                    .AnyAsync(ci => ci.DesignId == designId && ci.SessionId == sessionId);

                if (!isInCart)
                {
                    _logger.LogWarning($"Дизайн {designId} не найден в корзине неавторизованного пользователя с sessionId {sessionId}");
                    return null;
                }
            }
            else
            {
                _logger.LogWarning($"Неавторизованный пользователь без sessionId пытался получить непубличный дизайн {designId}");
                return null;
            }

            _logger.LogInformation($"Дизайн {designId} успешно получен пользователем {userId?.ToString() ?? "неавторизованным"} с sessionId {sessionId ?? "отсутствует"}");
            return design;
        }

        public async Task UpdateDesignAsync(Guid id, Guid userId, bool isAdminOrModerator, DesignUpdateDto request)
        {
            var design = await _context.Designs
                .FirstOrDefaultAsync(d => d.Id == id);
            if (design == null)
            {
                throw new NotFoundException("Design not found");
            }
            if (!isAdminOrModerator && design.UserId != userId)
            {
                throw new UnauthorizedException("User is not authorized to update this design");
            }
            design.Name = request.Name;
            design.Description = request.Description;
            design.PreviewUrl = request.PreviewUrl;
            design.DesignData = request.DesignData;
            design.DesignHash = request.DesignHash;
            design.ProductType = request.ProductType;
            await _context.SaveChangesAsync();
        }

        public async Task SubmitForModeration(Guid designId, Guid userId, ShareDesignRequest request)
        {
            var design = await _context.Designs
                .FirstOrDefaultAsync(d => d.Id == designId && d.UserId == userId);

            if (design == null)
            {
                _logger.LogWarning($"Дизайн с ID {designId} не найден или не принадлежит пользователю {userId}");
                throw new Exception("Дизайн не найден или вы не можете его отправить на модерацию.");
            }

            // Проверяем, что дизайн принадлежит пользователю или находится в его корзине
            var isOwner = design.UserId == userId;
            var isInCart = design.CartItems != null && design.CartItems.Any(ci => ci.UserId == userId);
            if (!isOwner && !isInCart)
            {
                _logger.LogWarning($"Пользователь {userId} не имеет прав делиться дизайном {designId}.");
                throw new Exception("Вы не можете поделиться этим дизайном.");
            }

            if (design.ModerationStatus != "Draft")
            {
                _logger.LogWarning($"Дизайн с ID {designId} уже отправлен на модерацию или обработан.");
                throw new Exception("Дизайн уже находится на модерации или обработан.");
            }

            design.Name = request.Name;
            design.Description = request.Description;
            design.ModerationStatus = "Pending";
            design.SubmittedForModerationAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            _logger.LogInformation($"Дизайн {designId} отправлен на модерацию пользователем {userId}");
        }

        public async Task<List<DesignDto>> GetPendingDesigns()
        {
            var designs = await _context.Designs
                .Where(d => d.ModerationStatus == "Pending")
                .Select(d => new DesignDto
                {
                    Id = d.Id,
                    Name = d.Name,
                    Description = d.Description,
                    PreviewUrl = d.PreviewUrl,
                    DesignData = d.DesignData,
                    DesignHash = d.DesignHash,
                    ProductType = d.ProductType,
                    DesignType = d.DesignType.Name, // Предполагается, что DesignType загружается через навигационное свойство
                    UserId = d.UserId.ToString(),
                    ModerationStatus = d.ModerationStatus
                })
                .ToListAsync();

            _logger.LogInformation($"Получено {designs.Count} дизайнов на модерации.");
            return designs;
        }

        public async Task ApproveDesign(Guid designId, ApproveDesignRequest request)
        {
            var design = await _context.Designs
                .FirstOrDefaultAsync(d => d.Id == designId);

            if (design == null || design.ModerationStatus != "Pending")
            {
                _logger.LogWarning($"Дизайн с ID {designId} не найден или не находится на модерации.");
                throw new Exception("Дизайн не найден или не находится на модерации.");
            }

            design.Name = request.Name;
            design.Description = request.Description;
            design.ModerationStatus = "Approved";
            design.ModeratorComment = request.ModeratorComment;

            await _context.SaveChangesAsync();
            _logger.LogInformation($"Дизайн {designId} одобрен модератором.");
        }

        public async Task RejectDesign(Guid designId, string moderatorComment)
        {
            var design = await _context.Designs
                .FirstOrDefaultAsync(d => d.Id == designId);

            if (design == null || design.ModerationStatus != "Pending")
            {
                _logger.LogWarning($"Дизайн с ID {designId} не найден или не находится на модерации.");
                throw new Exception("Дизайн не найден или не находится на модерации.");
            }

            design.ModerationStatus = "Rejected";
            design.ModeratorComment = moderatorComment;

            await _context.SaveChangesAsync();
            _logger.LogInformation($"Дизайн {designId} отклонён модератором.");
        }
    }
}
