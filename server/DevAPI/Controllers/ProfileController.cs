using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DevAPI.Models.DTOs;
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
        private readonly ILogger<ProfileController> _logger;

        public ProfileController(IProfileService profileService, ILogger<ProfileController> logger)
        {
            _profileService = profileService;
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
    }
}
