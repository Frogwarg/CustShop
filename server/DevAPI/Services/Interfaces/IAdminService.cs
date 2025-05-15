using DevAPI.Models.DTOs;

namespace DevAPI.Services.Interfaces
{
    public interface IAdminService
    {
        Task<List<UserDto>> GetUsersAsync(string search = null, string role = null);
        Task UpdateUserAsync(Guid userId, UpdateUserRequest request);
        Task DeleteUserAsync(Guid userId);
        Task UpdateUserRolesAsync(Guid userId, List<string> roles);
        Task BlockUserAsync(Guid userId);
        Task<List<OrderDto>> GetOrdersAsync(string status = null, string userEmail = null);
        Task UpdateOrderStatusAsync(Guid orderId, string status, string adminComment = null);
        Task LogAdminActionAsync(string actionType, string entityType, Guid? entityId, object details);
        Task<(List<AdminActionLogDto> Logs, int TotalCount)> GetAdminActionLogsAsync(string actionType = null, string entityType = null, DateTime? startDate = null, DateTime? endDate = null, int page = 1, int pageSize = 10);
    }
}
