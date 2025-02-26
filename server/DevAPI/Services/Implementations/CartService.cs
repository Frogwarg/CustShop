using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DevAPI.Data;
using DevAPI.Models.Entities;
using DevAPI.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace DevAPI.Services
{
    public class CartService : ICartService
    {
        private readonly StoreDbContext _context;

        public CartService(StoreDbContext context)
        {
            _context = context;
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
                    c.Design.DesignData == design.DesignData);

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
            return await _context.CartItems
            .Include(c => c.Design)
                .ThenInclude(d => d.DesignType)
            .Where(c => userId.HasValue ? c.UserId == userId : c.SessionId == sessionId)
            .Select(c => new CartItemDto
            {
                Design = new DesignDto
                {
                    Name = c.Design.Name,
                    Description = c.Design.Description,
                    PreviewUrl = c.Design.PreviewUrl,
                    DesignData = c.Design.DesignData,
                    ProductType = c.Design.ProductType
                },
                Quantity = c.Quantity,
                Price = c.Price
            })
            .ToListAsync();
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
                        c.Design.DesignData == anonymousItem.Design.DesignData);

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