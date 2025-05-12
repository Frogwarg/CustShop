using DevAPI.Models.DTOs;

namespace DevAPI.Services.Interfaces
{
    public interface IOrderService
    {
        Task<OrderDto> CreateOrderAsync(Guid? userId, string sessionId, CreateOrderDto request);
        Task<OrderDto> GetOrderAsync(Guid orderId, Guid? userId);
    }
}
