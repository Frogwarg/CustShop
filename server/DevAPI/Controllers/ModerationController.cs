using System.Security.Claims;
using DevAPI.Models.DTOs;
using DevAPI.Models.Entities;
using DevAPI.Services.Interfaces;
using DevAPI.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DevAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Moderator,Admin")]
    public class ModerationController : ControllerBase
    {
        private readonly IDesignService _designService;
        private readonly ICatalogService _catalogService;
        private readonly ILogger<ModerationController> _logger;
        private readonly StoreDbContext _context;

        public ModerationController(IDesignService designService, ICatalogService catalogService, ILogger<ModerationController> logger, StoreDbContext context)
        {
            _designService = designService;
            _catalogService = catalogService;
            _logger = logger;
            _context = context;
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
        private async Task<Guid> GetOrCreateDesignTypeId(string typeName)
        {
            var designType = await _context.DesignTypes
                .FirstOrDefaultAsync(dt => dt.Name == typeName);

            if (designType == null)
            {
                designType = new DesignType
                {
                    Id = Guid.NewGuid(),
                    Name = typeName,
                    Description = "Пользовательский дизайн",
                    BasePrice = 0,
                    Constraints = "{}"
                };
                _context.DesignTypes.Add(designType);
                await _context.SaveChangesAsync();
            }

            return designType.Id;
        }

        [HttpPost("direct-catalog-add")]
        public async Task<IActionResult> DirectCatalogAdd([FromBody] DirectCatalogAddRequest request)
        {
            var design = await _context.Designs.FirstOrDefaultAsync(d => d.Id == request.Id);
            Guid DesignTypeGuid = Guid.NewGuid();


            if (design == null)
            {
                design = new Design
                {
                    Id = request.Id,
                    UserId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value),
                    Name = request.Name,
                    Description = request.Description,
                    PreviewUrl = request.PreviewUrl,
                    DesignData = request.DesignData,
                    DesignHash = request.DesignHash,
                    ProductType = request.ProductType,
                    DesignTypeId = await GetOrCreateDesignTypeId("Custom"),
                    ModerationStatus = request.ModerationStatus,
                    SubmittedForModerationAt = DateTime.UtcNow,
                };
                _context.Designs.Add(design);
            }
            else
            {
                design.Name = request.Name;
                design.Description = request.Description;
                design.PreviewUrl = request.PreviewUrl;
                design.DesignData = request.DesignData;
                design.DesignHash = request.DesignHash;
                design.ProductType = request.ProductType;
                design.ModerationStatus = request.ModerationStatus;
            }

            await _context.SaveChangesAsync();

            if (request.ModerationStatus == "Approved")
            {
                var catalogItem = new CatalogItem
                {
                    Id = Guid.NewGuid(),
                    DesignId = design.Id,
                    Name = request.Name,
                    Description = request.Description,
                    Price = request.Price,
                    AuthorId = design.UserId.Value,
                    AddedToCatalogAt = DateTime.UtcNow,
                };
                _context.CatalogItems.Add(catalogItem);

                foreach (var tagId in request.TagIds)
                {
                    var tag = await _context.Tags.FindAsync(tagId);
                    if (tag != null)
                    {
                        catalogItem.CatalogItemTags.Add(new CatalogItemTag
                        {
                            CatalogItemId = catalogItem.Id,
                            TagId = tagId
                        });
                    }
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "Дизайн добавлен в каталог", catalogItemId = catalogItem.Id });
            }

            return Ok(new { message = "Дизайн сохранён с указанным статусом" });
        }
    }
}
