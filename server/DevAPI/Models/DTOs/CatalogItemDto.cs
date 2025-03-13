namespace DevAPI.Models.DTOs
{
    public class CatalogItemDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public string Tags { get; set; }
        public string PreviewUrl { get; set; } // Берётся из Design.PreviewUrl
        public decimal? DiscountedPrice { get; set; }
    }
}
