using DevAPI.Models.DTOs;

namespace DevAPI.Services.Interfaces
{
    public interface IOrderService
    {
        Task<OrderDto> CreateOrderAsync(Guid? userId, string sessionId, CreateOrderDto request);
        Task<OrderDto> GetOrderAsync(Guid orderId, Guid? userId);
        Task<List<OrderDto>> GetPaidOrdersAsync();
        Task<OrderDto> UpdateOrderStatusAsync(Guid orderId, string newStatus, AddressDto? newAddress = null);
    }
}
