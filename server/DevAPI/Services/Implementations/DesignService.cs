using DevAPI.Models.DTOs;
using DevAPI.Models.Entities;
using DevAPI.Services.Interfaces;
using Google;
using DevAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace DevAPI.Services.Implementations
{
    public class DesignService : IDesignService
    {
        private readonly StoreDbContext _context;
        private readonly ILogger<DesignService> _logger;

        public DesignService(StoreDbContext context, ILogger<DesignService> logger)
        {
            _context = context;
            _logger = logger;
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
                    DesignType = d.DesignType.Name // Предполагается, что DesignType загружается через навигационное свойство
                })
                .ToListAsync();

            _logger.LogInformation($"Получено {designs.Count} дизайнов на модерации.");
            return designs;
        }

        public async Task ApproveDesign(Guid designId, string moderatorComment)
        {
            var design = await _context.Designs
                .FirstOrDefaultAsync(d => d.Id == designId);

            if (design == null || design.ModerationStatus != "Pending")
            {
                _logger.LogWarning($"Дизайн с ID {designId} не найден или не находится на модерации.");
                throw new Exception("Дизайн не найден или не находится на модерации.");
            }

            design.ModerationStatus = "Approved";
            design.ModeratorComment = moderatorComment;

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
