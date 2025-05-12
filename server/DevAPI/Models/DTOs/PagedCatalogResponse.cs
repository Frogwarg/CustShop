namespace DevAPI.Models.DTOs
{
    public class PagedCatalogResponse
    {
        public List<CatalogItemDto> Items { get; set; } = new List<CatalogItemDto>();
        public int TotalItems { get; set; }
        public int TotalPages { get; set; }
        public int CurrentPage { get; set; }
        public int PageSize { get; set; }
    }
}
