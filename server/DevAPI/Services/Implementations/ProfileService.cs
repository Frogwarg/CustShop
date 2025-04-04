using Microsoft.AspNetCore.Identity;
using DevAPI.Models.Entities;
using DevAPI.Models.DTOs;
using DevAPI.Exceptions;
using Microsoft.EntityFrameworkCore;
using DevAPI.Services.Interfaces;
using DevAPI.Data;

namespace DevAPI.Services
{
    public class ProfileService : IProfileService
    {
        private readonly UserManager<User> _userManager;
        private readonly StoreDbContext _context;

        public ProfileService(UserManager<User> userManager, StoreDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        public async Task<UserProfileDto> GetUserProfileAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) throw new UnauthorizedException();

            return new UserProfileDto
            {
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                AvatarUrl = user.UserProfile?.AvatarUrl,
                Bio = user.UserProfile?.Bio
            };
        }

        public async Task UpdateUserProfileAsync(Guid userId, UpdateProfileRequest request)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) throw new UnauthorizedException();

            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.PhoneNumber = request.PhoneNumber;

            if (user.UserProfile == null)
            {
                user.UserProfile = new UserProfile { UserId = userId };
            }
            user.UserProfile.AvatarUrl = request.AvatarUrl;
            user.UserProfile.Bio = request.Bio;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                throw new BadRequestException(string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }

        public async Task<List<DesignDto>> GetUserDesignsAsync(Guid userId)
        {
            var designs = await _context.Set<Design>()
                .Where(d => d.UserId == userId)
                .Select(d => new DesignDto
                {
                    Id = d.Id,
                    Name = d.Name,
                    Description = d.Description,
                    PreviewUrl = d.PreviewUrl,
                    ProductType = d.ProductType,
                })
                .ToListAsync();

            return designs;
        }
    }
}