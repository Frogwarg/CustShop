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
                AuthorId = design.UserId.Value,
                AddedToCatalogAt = DateTime.UtcNow,
                DiscountedPrice = null
            };

            _context.CatalogItems.Add(catalogItem);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Создан CatalogItem {catalogItem.Id} для дизайна {designId}");
            return catalogItem;
        }

        public async Task<PagedCatalogResponse> GetCatalogItems(string? tags, string? productType, int page, int pageSize)
        {
            var query = _context.CatalogItems
                .Include(c => c.Design)
                .ThenInclude(d => d.DesignType)
                .AsQueryable();

            if (!string.IsNullOrEmpty(tags))
            {
                var tagList = tags.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(t => t.Trim().ToLower())
                    .ToList();
                query = query.Where(c => tagList.Any(t => c.Tags.ToLower().Contains(t)));
            }

            if (!string.IsNullOrEmpty(productType))
            {
                query = query.Where(c => c.Design.ProductType.ToLower() == productType.ToLower());
            }

            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

            var items = await query
                .OrderBy(c => c.AddedToCatalogAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new CatalogItemDto
                {
                    Id = c.Id,
                    DesignId = c.DesignId,
                    Name = c.Name,
                    Description = c.Design.Description,
                    Price = c.Price,
                    Tags = c.Tags,
                    PreviewUrl = c.Design.PreviewUrl,
                    DiscountedPrice = c.DiscountedPrice,
                    ProductType = c.Design.ProductType
                })
                .ToListAsync();

            _logger.LogInformation($"Получено {items.Count} товаров из каталога. Страница {page}, размер страницы {pageSize}.");
            return new PagedCatalogResponse
            {
                Items = items,
                TotalItems = totalItems,
                TotalPages = totalPages,
                CurrentPage = page,
                PageSize = pageSize
            };
        }

        public async Task<CatalogItemDetailsDto?> GetCatalogItemDetails(Guid catalogItemId)
        {
            var item = await _context.CatalogItems
                .Include(c => c.Design)
                .ThenInclude(d => d.DesignType)
                .Include(c => c.Author)
                .FirstOrDefaultAsync(c => c.Id == catalogItemId);

            if (item == null)
            {
                _logger.LogWarning($"Товар с ID {catalogItemId} не найден.");
                return null;
            }

            var productDetails = GetProductDetails(item.Design.ProductType);

            return new CatalogItemDetailsDto
            {
                Id = item.Id,
                DesignId = item.DesignId,
                Name = item.Name,
                Description = item.Description,
                Price = item.Price,
                DiscountedPrice = item.DiscountedPrice,
                Tags = item.Tags,
                PreviewUrl = item.Design.PreviewUrl,
                ProductType = item.Design.ProductType,
                DesignData = item.Design.DesignData,
                AuthorName = item.Author?.UserName ?? "Unknown",
                Sizes = productDetails.Sizes,
                Materials = productDetails.Materials,
                AdditionalInfo = productDetails.AdditionalInfo
            };
        }

        private ProductDetails GetProductDetails(string productType)
        {
            return productType.ToLower() switch
            {
                "shirt" => new ProductDetails
                {
                    Sizes = new List<string> { "S", "M", "L", "XL", "XXL" },
                    Materials = new List<string> { "100% хлопок", "Хлопок/полиэстер" },
                    AdditionalInfo = "Машинная стирка при 30°C, не отбеливать."
                },
                "mug" => new ProductDetails
                {
                    Sizes = new List<string> { "330 мл", "450 мл" },
                    Materials = new List<string> { "Керамика", "Стекло" },
                    AdditionalInfo = "Подходит для микроволновки и посудомоечной машины."
                },
                "pillow" => new ProductDetails
                {
                    Sizes = new List<string> { "40x40 см", "50x50 см" },
                    Materials = new List<string> { "Полиэстер", "Хлопок" },
                    AdditionalInfo = "Съёмный чехол, наполнитель - гипоаллергенный холлофайбер."
                },
                _ => new ProductDetails
                {
                    Sizes = new List<string> { "Стандартный" },
                    Materials = new List<string> { "Не указано" },
                    AdditionalInfo = "Нет дополнительной информации."
                }
            };
        }
    }

    public class ProductDetails
    {
        public List<string> Sizes { get; set; } = new List<string>();
        public List<string> Materials { get; set; } = new List<string>();
        public string AdditionalInfo { get; set; } = string.Empty;
    }
}