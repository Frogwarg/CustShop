using DevAPI.Models.DTOs;

namespace DevAPI.Services.Interfaces
{
    public interface IProfileService
    {
        Task<UserProfileDto> GetUserProfileAsync(Guid userId);
        Task UpdateUserProfileAsync(Guid userId, UpdateProfileRequest request);
        Task<List<DesignDto>> GetUserDesignsAsync(Guid userId);
        Task<List<AddressDto>> GetUserAddressesAsync(Guid userId);
        Task<AddressDto> AddUserAddressAsync(Guid userId, AddressRequest request);
        Task DeleteUserAddressAsync(Guid userId, string addressId);
        Task<List<OrderDto>> GetUserOrdersAsync(Guid userId);
    }
}