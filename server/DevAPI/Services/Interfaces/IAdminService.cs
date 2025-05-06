using DevAPI.Models.DTOs;

namespace DevAPI.Services.Interfaces
{
    public interface IAdminService
    {
        Task<List<UserDto>> GetUsersAsync(string search = null);
        Task UpdateUserRolesAsync(Guid userId, List<string> roles);
        Task BlockUserAsync(Guid userId);
        Task<List<OrderDto>> GetOrdersAsync(string status = null, string userEmail = null);
        Task UpdateOrderStatusAsync(Guid orderId, string status, string adminComment = null);
        Task LogAdminActionAsync(Guid adminId, string actionType, string entityType, Guid? entityId, string details);
    }
}
