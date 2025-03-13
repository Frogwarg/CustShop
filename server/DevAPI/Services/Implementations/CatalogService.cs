using DevAPI.Data;
using DevAPI.Models.DTOs;
using DevAPI.Models.Entities;
using DevAPI.Services.Interfaces;
using Google;
using Microsoft.EntityFrameworkCore;

namespace DevAPI.Services.Implementations
{
    public class CatalogService : ICatalogService
    {
        private readonly StoreDbContext _context;
        private readonly ILogger<CatalogService> _logger;

        public CatalogService(StoreDbContext context, ILogger<CatalogService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<CatalogItem> CreateCatalogItem(Guid designId, ApproveDesignRequest request)
        {
            var design = await _context.Designs
                .Include(d => d.User) // Загружаем автора дизайна
                .FirstOrDefaultAsync(d => d.Id == designId);

            if (design == null || design.ModerationStatus != "Approved")
            {
                _logger.LogWarning($"Дизайн с ID {designId} не найден или не одобрен.");
                throw new Exception("Дизайн не найден или не одобрен для добавления в каталог.");
            }

            var catalogItem = new CatalogItem
            {
                Id = Guid.NewGuid(),
                DesignId = designId,
                Name = request.Name,
                Description = request.Description,
                Price = request.Price,
                Tags = request.Tags,
                AuthorId = design.UserId.Value, // Предполагается, что UserId не null
                AddedToCatalogAt = DateTime.UtcNow,
                DiscountedPrice = null // Можно добавить логику для скидок позже
            };

            _context.CatalogItems.Add(catalogItem);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Создан CatalogItem {catalogItem.Id} для дизайна {designId}");
            return catalogItem;
        }

        public async Task<List<CatalogItemDto>> GetCatalogItems()
        {
            var items = await _context.CatalogItems
                .Include(c => c.Design) // Загружаем данные дизайна
                .Select(c => new CatalogItemDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    Price = c.Price,
                    Tags = c.Tags,
                    PreviewUrl = c.Design.PreviewUrl, // Берём из связанного дизайна
                    DiscountedPrice = c.DiscountedPrice
                })
                .ToListAsync();

            _logger.LogInformation($"Получено {items.Count} товаров из каталога.");
            return items;
        }
    }
}
