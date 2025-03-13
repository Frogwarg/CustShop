using DevAPI.Models.DTOs;
using DevAPI.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DevAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Moderator")]
    public class ModerationController : ControllerBase
    {
        private readonly IDesignService _designService;
        private readonly ICatalogService _catalogService;
        private readonly ILogger<ModerationController> _logger;

        public ModerationController(IDesignService designService, ICatalogService catalogService, ILogger<ModerationController> logger)
        {
            _designService = designService;
            _catalogService = catalogService;
            _logger = logger;
        }

        [HttpGet("pending")]
        public async Task<ActionResult<List<DesignDto>>> GetPendingDesigns()
        {
            var designs = await _designService.GetPendingDesigns();
            return Ok(designs);
        }

        [HttpPost("{designId}/approve")]
        public async Task<IActionResult> ApproveDesign(Guid designId, [FromBody] ApproveDesignRequest request)
        {
            await _designService.ApproveDesign(designId, request.ModeratorComment);
            var catalogItem = await _catalogService.CreateCatalogItem(designId, request);
            return Ok(new { message = "Дизайн одобрен и добавлен в каталог", catalogItemId = catalogItem.Id });
        }

        [HttpPost("{designId}/reject")]
        public async Task<IActionResult> RejectDesign(Guid designId, [FromBody] ModerationDecision request)
        {
            await _designService.RejectDesign(designId, request.ModeratorComment);
            return Ok(new { message = "Дизайн отклонён" });
        }
    }
}
