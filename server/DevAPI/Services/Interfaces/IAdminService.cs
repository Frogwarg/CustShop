using DevAPI.Models.DTOs;
using System.Collections.Generic;

namespace DevAPI.Services.Interfaces
{
    public interface IAdminService
    {
        Task<(List<TagDto> Tags, int TotalCount)> GetTagsAsync(string search = null, int page = 1, int pageSize = 10);
        Task<(List<UserDto> Users, int TotalCount)> GetUsersAsync(string search = null, string role = null, int page = 1, int pageSize = 10);
        Task UpdateUserAsync(Guid userId, UpdateUserRequest request);
        Task DeleteUserAsync(Guid userId);
        Task<(List<AdminDesignDto> Designs, int TotalCount)> GetDesignsAsync(string search = null, string moderationStatus = null, Guid? userId = null, int page = 1, int pageSize = 10);
        Task UpdateDesignAsync(Guid designId, UpdateDesignRequest request);
        Task DeleteDesignAsync(Guid designId);
        Task<(List<AdminOrderDto> Orders, int TotalCount)> GetOrdersAsync(string search = null, string status = null, string paymentStatus = null, DateTime? startDate = null, DateTime? endDate = null, string customerName = null, int page = 1, int pageSize = 10);
        Task UpdateOrderStatusAsync(Guid orderId, string status, string paymentStatus, string adminComment = null);
        Task LogAdminActionAsync(string actionType, string entityType, Guid? entityId, object details);
        Task<(List<AdminActionLogDto> Logs, int TotalCount)> GetAdminActionLogsAsync(string actionType = null, string entityType = null, DateTime? startDate = null, DateTime? endDate = null, int page = 1, int pageSize = 10);
    }
}
