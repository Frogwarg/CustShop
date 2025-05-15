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
        private readonly ILogger<ProfileService> _logger;

        public ProfileService(UserManager<User> userManager, StoreDbContext context, ILogger<ProfileService> logger)
        {
            _userManager = userManager;
            _context = context;
            _logger = logger;
        }

        public async Task<UserProfileDto> GetUserProfileAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) throw new UnauthorizedException();
            var userProfile = await _context.Set<UserProfile>()
                .FirstOrDefaultAsync(up => up.UserId == userId);

            return new UserProfileDto
            {
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                AvatarUrl = userProfile?.AvatarUrl,
                MiddleName = userProfile?.MiddleName,
                Bio = userProfile?.Bio
            };
        }

        public async Task UpdateUserProfileAsync(Guid userId, UpdateProfileRequest request)
        {
            var user = await _userManager.Users
                .Include(u => u.UserProfile)
                .FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) throw new UnauthorizedException();

            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.PhoneNumber = request.PhoneNumber;

            if (user.UserProfile == null)
            {
                user.UserProfile = new UserProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    MiddleName = request.MiddleName,
                    AvatarUrl = request.AvatarUrl,
                    Bio = request.Bio,
                    LastLogin = DateTime.UtcNow
                };
                _context.UserProfiles.Add(user.UserProfile);
            }
            else
            {
                user.UserProfile.MiddleName = request.MiddleName;
                user.UserProfile.AvatarUrl = request.AvatarUrl;
                user.UserProfile.Bio = request.Bio;
                user.UserProfile.LastLogin = DateTime.UtcNow;
            }

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                throw new BadRequestException(string.Join(", ", result.Errors.Select(e => e.Description)));
            }

            await _context.SaveChangesAsync();
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
                    CreatedAt = d.CreatedAt
                })
                .ToListAsync();

            return designs;
        }

        public async Task<List<AddressDto>> GetUserAddressesAsync(Guid userId)
        {
            var addresses = await _context.SavedAddresses
                .Where(sa => sa.UserId == userId)
                .Include(sa => sa.Address)
                .Select(sa => new AddressDto
                {
                    Id = sa.Id.ToString(),
                    Street = sa.Address.Street,
                    City = sa.Address.City,
                    State = sa.Address.State,
                    PostalCode = sa.Address.PostalCode,
                    Country = sa.Address.Country,
                    Label = sa.Label
                })
                .ToListAsync();

            return addresses;
        }

        public async Task<AddressDto> AddUserAddressAsync(Guid userId, AddressRequest request)
        {
            var address = new Address
            {
                Id = Guid.NewGuid(),
                Street = request.Street,
                City = request.City,
                State = request.State,
                PostalCode = request.PostalCode,
                Country = request.Country
            };

            var savedAddress = new SavedAddress
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AddressId = address.Id,
                Label = request.Label,
                Address = address
            };

            _context.Addresses.Add(address);
            _context.SavedAddresses.Add(savedAddress);
            await _context.SaveChangesAsync();

            return new AddressDto
            {
                Id = savedAddress.Id.ToString(),
                Street = address.Street,
                City = address.City,
                State = address.State,
                PostalCode = address.PostalCode,
                Country = address.Country,
                Label = savedAddress.Label
            };
        }

        public async Task DeleteUserAddressAsync(Guid userId, string addressId)
        {
            var savedAddress = await _context.SavedAddresses
                .FirstOrDefaultAsync(sa => sa.Id == Guid.Parse(addressId) && sa.UserId == userId);
            if (savedAddress == null)
                throw new NotFoundException("Адрес не найден");

            var address = await _context.Addresses
                .FirstOrDefaultAsync(a => a.Id == savedAddress.AddressId);
            if (address != null)
                _context.Addresses.Remove(address);

            _context.SavedAddresses.Remove(savedAddress);
            await _context.SaveChangesAsync();
        }
        public async Task<List<OrderDto>> GetUserOrdersAsync(Guid userId)
        {
            var orders = await _context.Orders
                .Where(o => o.UserId == userId)
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Design)
                .Select(o => new OrderDto 
                {
                    Id = o.Id,
                    TotalAmount = o.TotalAmount,
                    Status = o.Status,
                    PaymentStatus = o.PaymentStatus,
                    DeliveryMethod = o.DeliveryMethod,
                    CreatedAt = o.CreatedAt,
                    OrderItems = o.OrderItems.Select(oi => new OrderItemDto
                    {
                        DesignId = oi.DesignId,
                        DesignName = oi.Design.Name,
                        Quantity = oi.Quantity,
                        UnitPrice = oi.UnitPrice,
                        PreviewUrl = oi.Design.PreviewUrl
                    }).ToList()
                })
                .ToListAsync();

            return orders;
        }
    }
}