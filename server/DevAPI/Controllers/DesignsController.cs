using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DevAPI.Data;
using DevAPI.Models.Entities;
using DevAPI.Models.DTOs;
using DevAPI.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using DevAPI.Exceptions;

namespace DevAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DesignController : ControllerBase
    {
        private readonly IDesignService _designService;
        private readonly ILogger<DesignController> _logger;
        private readonly StoreDbContext _context;

        public DesignController(IDesignService designService, ILogger<DesignController> logger, StoreDbContext context)
        {
            _designService = designService;
            _logger = logger;
            _context = context;
        }
        [HttpGet("tags")]
        public async Task<ActionResult<List<TagDto>>> GetTags()
        {
            var tags = await _context.Tags
                .Select(t => new TagDto { Id = t.Id, Name = t.Name })
                .ToListAsync();
            return Ok(tags);
        }

        [HttpGet("{designId}")]
        //[Authorize]
        public async Task<IActionResult> GetDesign(Guid designId)
        {
            try
            {
                Guid? userId = User.Identity.IsAuthenticated
                    ? Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value)
                    : null;
                var sessionId = userId.HasValue
                    ? null
                    : HttpContext.Request.Cookies["cart_session_id"];
                var design = await _designService.GetDesignById(designId, userId, sessionId);
                if (design == null)
                {
                    return NotFound("Дизайн не найден или вы не имеете к нему доступа.");
                }
                return Ok(design);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении дизайна");
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateDesign(Guid id, [FromBody] DesignUpdateDto request)
        {
            _logger.LogInformation("Получен запрос на обновление дизайна");
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                var isAdminOrModerator = User.IsInRole("Admin") || User.IsInRole("Moderator");
                await _designService.UpdateDesignAsync(id, userId, isAdminOrModerator, request);
                return Ok(new { message = "Design updated successfully" });
            }
            catch (UnauthorizedException)
            {
                return Unauthorized();
            }
            catch (NotFoundException)
            {
                return NotFound();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating design {id}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost("{designId}/share")]
        [Authorize]
        public async Task<IActionResult> ShareDesign(Guid designId, [FromBody] ShareDesignRequest request)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                await _designService.SubmitForModeration(designId, userId, request);
                return Ok(new { message = "Дизайн отправлен на модерацию" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при отправке дизайна на модерацию");
                return StatusCode(500, ex.Message);
            }
        }
    }
}
