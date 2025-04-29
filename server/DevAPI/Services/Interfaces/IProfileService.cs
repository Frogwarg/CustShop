using DevAPI.Models.DTOs;

namespace DevAPI.Services.Interfaces
{
    public interface IProfileService
    {
        Task<UserProfileDto> GetUserProfileAsync(Guid userId);
        Task UpdateUserProfileAsync(Guid userId, UpdateProfileRequest request);
        Task<List<DesignDto>> GetUserDesignsAsync(Guid userId);
        Task<DesignDto> SaveDesignAsync(Guid userId, SaveDesignRequest request);
    }
}