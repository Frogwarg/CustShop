using System.Collections.Generic;
using System.Threading.Tasks;
using DevAPI.Models.DTOs;

namespace DevAPI.Services
{
    public interface ICartService
    {
        Task AddToCart(Guid? userId, string sessionId, CartItemDto cartItem);
        Task RemoveFromCart(Guid? userId, string sessionId, Guid productId);
        Task<List<CartItemDto>> GetCart(Guid? userId, string sessionId);
        Task ClearCart(Guid? userId, string sessionId);
        Task UpdateQuantity(Guid? userId, string sessionId, Guid productId, int quantity);
        Task MergeAnonymousCart(Guid userId, string sessionId);
    }
} 