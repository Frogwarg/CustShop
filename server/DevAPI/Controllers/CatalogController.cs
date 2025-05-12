using DevAPI.Models.DTOs;
using DevAPI.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DevAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CatalogController : ControllerBase
    {
        private readonly ICatalogService _catalogService;

        public CatalogController(ICatalogService catalogService)
        {
            _catalogService = catalogService;
        }

        [HttpGet]
        public async Task<ActionResult<PagedCatalogResponse>> GetCatalog(
            [FromQuery] string? tags = null,
            [FromQuery] string? productType = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var items = await _catalogService.GetCatalogItems(tags, productType, page, pageSize);
            return Ok(items);
        }

        [HttpGet("{catalogItemId}")]
        public async Task<ActionResult<CatalogItemDetailsDto>> GetCatalogItem(Guid catalogItemId)
        {
            var item = await _catalogService.GetCatalogItemDetails(catalogItemId);
            if (item == null)
            {
                return NotFound("Товар не найден.");
            }
            return Ok(item);
        }
    }
}
