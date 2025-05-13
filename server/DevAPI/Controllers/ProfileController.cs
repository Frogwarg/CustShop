using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DevAPI.Models.DTOs;
using DevAPI.Models.Entities;
using DevAPI.Data;
using DevAPI.Services.Interfaces;
using System.Security.Claims;
using DevAPI.Exceptions;

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
        public async Task<ActionResult<List<AddressDto>>> GetUserAddresses()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var addresses = await _profileService.GetUserAddressesAsync(Guid.Parse(userId));
            return Ok(addresses);
        }

        [HttpPost("addresses")]
        public async Task<ActionResult<AddressDto>> AddAddress([FromBody] AddressRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var address = await _profileService.AddUserAddressAsync(Guid.Parse(userId), request);
            return Ok(address);
        }

        [HttpDelete("addresses/{addressId}")]
        public async Task<IActionResult> DeleteAddress(string addressId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                await _profileService.DeleteUserAddressAsync(Guid.Parse(userId), addressId);
                return Ok(new { message = "Адрес удален" });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
        [HttpGet("orders")]
        public async Task<ActionResult<List<OrderDto>>> GetUserOrders()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var orders = await _profileService.GetUserOrdersAsync(Guid.Parse(userId));
            return Ok(orders);
        }
    }
}
