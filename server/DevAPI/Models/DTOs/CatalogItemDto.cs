namespace DevAPI.Models.DTOs
{
    public class CatalogItemDto
    {
        public Guid Id { get; set; }
        public Guid DesignId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public decimal? DiscountedPrice { get; set; }
        public List<string> Tags { get; set; } = new List<string>();
        public string PreviewUrl { get; set; }
        public string ProductType { get; set; }

    }
}
