using DevAPI.Models.DTOs;
using DevAPI.Models.Entities;
using DevAPI.Services.Implementations;

namespace DevAPI.Services.Interfaces
{
    public interface ICatalogService
    {
        Task<CatalogItem> CreateCatalogItem(Guid designId, ApproveDesignRequest request);
        Task<PagedCatalogResponse> GetCatalogItems(string? tags, string? productType, int page, int pageSize);
        Task<CatalogItemDetailsDto?> GetCatalogItemDetails(Guid catalogItemId);
    }
}
