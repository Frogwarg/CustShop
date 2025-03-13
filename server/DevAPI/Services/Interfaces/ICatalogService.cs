using DevAPI.Models.DTOs;
using DevAPI.Models.Entities;

namespace DevAPI.Services.Interfaces
{
    public interface ICatalogService
    {
        Task<CatalogItem> CreateCatalogItem(Guid designId, ApproveDesignRequest request);
        Task<List<CatalogItemDto>> GetCatalogItems();
    }
}
