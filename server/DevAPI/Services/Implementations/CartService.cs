using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DevAPI.Data;
using DevAPI.Models.Entities;
using DevAPI.Models.DTOs;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using DevAPI.Controllers;

namespace DevAPI.Services
{
    public class CartService : ICartService
    {
        private readonly StoreDbContext _context;
        private readonly ILogger<CartController> _logger;

        public CartService(StoreDbContext context, ILogger<CartController> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task AddToCart(Guid? userId, string sessionId, CartItemDto cartItemDto)
        {
            var design = new Design
            {
                Id = Guid.NewGuid(),
                Name = cartItemDto.Design.Name,
                Description = cartItemDto.Design.Description,
                PreviewUrl = cartItemDto.Design.PreviewUrl,
                DesignData = cartItemDto.Design.DesignData,
                DesignHash = cartItemDto.Design.DesignHash,
                ProductType = cartItemDto.Design.ProductType,
                DesignTypeId = await GetOrCreateDesignTypeId("Custom"), // Получаем ID для типа Custom
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Designs.Add(design);
            await _context.SaveChangesAsync();

            var existingItem = await _context.CartItems
                .Include(c => c.Design)
                .FirstOrDefaultAsync(c =>
                    (userId.HasValue ? c.UserId == userId : c.SessionId == sessionId) &&
                    c.Design.ProductType == design.ProductType &&
                    c.Design.DesignHash == design.DesignHash);

            if (existingItem != null)
            {
                existingItem.Quantity += cartItemDto.Quantity;
            }
            else
            {
                var newItem = new CartItem
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    SessionId = !userId.HasValue ? sessionId : null,
                    DesignId = design.Id,
                    Quantity = cartItemDto.Quantity,
                    Price = cartItemDto.Price,
                    CreatedAt = DateTime.UtcNow
                };
                _context.CartItems.Add(newItem);
            }

            await _context.SaveChangesAsync();
        }

        private async Task<Guid> GetOrCreateDesignTypeId(string typeName)
        {
            var designType = await _context.DesignTypes
                .FirstOrDefaultAsync(dt => dt.Name == typeName);

            if (designType == null)
            {
                designType = new DesignType
                {
                    Id = Guid.NewGuid(),
                    Name = typeName,
                    Description = "Пользовательский дизайн",
                    BasePrice = 0,
                    Constraints = "{}"
                };
                _context.DesignTypes.Add(designType);
                await _context.SaveChangesAsync();
            }

            return designType.Id;
        }

        public async Task RemoveFromCart(Guid? userId, string sessionId, Guid designId)
        {
            var item = await _context.CartItems
                .Include(c => c.Design)
                .FirstOrDefaultAsync(c => 
                    (userId.HasValue ? c.UserId == userId : c.SessionId == sessionId) && 
                    c.DesignId == designId);

            if (item != null)
            {
                if (!await _context.CartItems.AnyAsync(c => c.DesignId == designId && c.Id != item.Id))
                {
                    _context.Designs.Remove(item.Design);
                }
                _context.CartItems.Remove(item);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<CartItemDto>> GetCart(Guid? userId, string sessionId)
        {
            var query = _context.CartItems.AsQueryable();

            if (userId.HasValue)
            {
                query = query.Where(c => c.UserId == userId);
            }
            else if (!string.IsNullOrEmpty(sessionId))
            {
                query = query.Where(c => c.SessionId == sessionId);
            }
            else
            {
                return new List<CartItemDto>();
            }

            var items = await query
            .Include(c => c.Design)
                .ThenInclude(d => d.DesignType)
            .Select(c => new CartItemDto
            {
                Design = new DesignDto
                {
                    Id = c.Design.Id,
                    Name = c.Design.Name,
                    Description = c.Design.Description,
                    PreviewUrl = c.Design.PreviewUrl,
                    DesignData = c.Design.DesignData,
                    DesignHash = c.Design.DesignHash,
                    ProductType = c.Design.ProductType
                },
                Quantity = c.Quantity,
                Price = c.Price
            })
            .ToListAsync();

            _logger?.LogInformation($"Returning {items.Count} items for UserId: {userId} or SessionId: {sessionId}");
            return items;

        }

        public async Task ClearCart(Guid? userId, string sessionId)
        {
            var items = await _context.CartItems
                .Include(c => c.Design)
                .Where(c => userId.HasValue ? c.UserId == userId : c.SessionId == sessionId)
                .ToListAsync();

            foreach (var item in items)
            {
                // Удаляем дизайн, если он больше нигде не используется
                if (!await _context.CartItems.AnyAsync(c => c.DesignId == item.DesignId && c.Id != item.Id))
                {
                    _context.Designs.Remove(item.Design);
                }
            }

            _context.CartItems.RemoveRange(items);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateQuantity(Guid? userId, string sessionId, Guid designId, int quantity)
        {
            var item = await _context.CartItems
                .FirstOrDefaultAsync(c => 
                    (userId.HasValue ? c.UserId == userId : c.SessionId == sessionId) && 
                    c.DesignId == designId);

            if (item != null)
            {
                item.Quantity = quantity;
                await _context.SaveChangesAsync();
            }
        }

        public async Task MergeAnonymousCart(Guid userId, string sessionId)
        {
            var anonymousItems = await _context.CartItems
                .Include(c => c.Design)
                .Where(c => c.SessionId == sessionId)
                .ToListAsync();

            foreach (var anonymousItem in anonymousItems)
            {
                var userItem = await _context.CartItems
                    .FirstOrDefaultAsync(c =>
                        c.UserId == userId &&
                        c.Design.ProductType == anonymousItem.Design.ProductType &&
                        c.Design.DesignHash == anonymousItem.Design.DesignHash);

                if (userItem != null)
                {
                    userItem.Quantity += anonymousItem.Quantity;
                    _context.CartItems.Remove(anonymousItem);
                    // Удаляем дизайн анонимного товара, если он больше нигде не используется
                    if (!await _context.CartItems.AnyAsync(c => c.DesignId == anonymousItem.DesignId && c.Id != anonymousItem.Id))
                    {
                        _context.Designs.Remove(anonymousItem.Design);
                    }
                }
                else
                {
                    anonymousItem.UserId = userId;
                    anonymousItem.SessionId = null;
                    anonymousItem.Design.UserId = userId;
                }
            }

            await _context.SaveChangesAsync();
        }
    }
} 