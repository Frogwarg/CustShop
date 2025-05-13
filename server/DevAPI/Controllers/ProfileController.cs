using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DevAPI.Models.DTOs;
using DevAPI.Models.Entities;
using DevAPI.Data;
using DevAPI.Services.Interfaces;
using System.Security.Claims;

namespace DevAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly IProfileService _profileService;
        private readonly StoreDbContext _context;
        private readonly ILogger<ProfileController> _logger;

        public ProfileController(IProfileService profileService, StoreDbContext context, ILogger<ProfileController> logger)
        {
            _profileService = profileService;
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<UserProfileDto>> GetProfile()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var profile = await _profileService.GetUserProfileAsync(Guid.Parse(userId));
            return Ok(profile);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            await _profileService.UpdateUserProfileAsync(Guid.Parse(userId), request);
            return Ok(new { message = "Профиль обновлен" });
        }

        [HttpPost("designs")]
        public async Task<ActionResult<DesignDto>> SaveDesign([FromBody] SaveDesignRequest request)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                var design = await _profileService.SaveDesignAsync(Guid.Parse(userId), request);
                return Ok(design);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при сохранении дизайна");
                return StatusCode(500, new { message = "Ошибка сервера" });
            }
        }

        [HttpGet("designs")]
        public async Task<ActionResult<List<DesignDto>>> GetUserDesigns()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var designs = await _profileService.GetUserDesignsAsync(Guid.Parse(userId));
            return Ok(designs);
        }

        [HttpGet("addresses")]
        public async Task<ActionResult<List<SavedAddress>>> GetUserAddresses()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var addresses = await _context.SavedAddresses
                .Where(sa => sa.UserId == Guid.Parse(userId))
                .Include(sa => sa.Address)
                .Select(sa => new
                {
                    id = sa.Id.ToString(),
                    street = sa.Address.Street,
                    city = sa.Address.City,
                    state = sa.Address.State,
                    postalCode = sa.Address.PostalCode,
                    country = sa.Address.Country,
                    label = sa.Label
                })
                .ToListAsync();

            return Ok(addresses);
        }

        [HttpPost("addresses")]
        public async Task<ActionResult<SavedAddress>> AddAddress([FromBody] AddressRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

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
                UserId = Guid.Parse(userId),
                AddressId = address.Id,
                Label = request.Label,
                Address = address
            };

            _context.Addresses.Add(address);
            _context.SavedAddresses.Add(savedAddress);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = savedAddress.Id.ToString(),
                street = address.Street,
                city = address.City,
                state = address.State,
                postalCode = address.PostalCode,
                country = address.Country,
                label = savedAddress.Label
            });
        }

        [HttpDelete("designs/{designId}")]
        public async Task<IActionResult> DeleteDesign(string designId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var design = await _context.Designs
                .FirstOrDefaultAsync(d => d.Id == Guid.Parse(designId) && d.UserId == Guid.Parse(userId));
            if (design == null)
                return NotFound(new { message = "Дизайн не найден" });

            _context.Designs.Remove(design);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Дизайн удален" });
        }
    }
    public class AddressRequest
    {
        public string Street { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string PostalCode { get; set; }
        public string Country { get; set; }
        public string Label { get; set; }
    }
}
