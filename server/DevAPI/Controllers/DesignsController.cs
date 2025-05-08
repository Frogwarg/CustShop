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

namespace DevAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DesignController : ControllerBase
    {
        private readonly IDesignService _designService;
        private readonly ILogger<DesignController> _logger;

        public DesignController(IDesignService designService, ILogger<DesignController> logger)
        {
            _designService = designService;
            _logger = logger;
        }

        [HttpGet("{designId}")]
        [Authorize]
        public async Task<IActionResult> GetDesign(Guid designId)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                var design = await _designService.GetDesignById(designId, userId);
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
