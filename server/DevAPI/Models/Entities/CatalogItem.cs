namespace DevAPI.Models.Entities
{
    public class CatalogItem
    {
        public Guid Id { get; set; }
        public Guid DesignId { get; set; }
        public string Name { get; set; } // Может отличаться от Design.Name
        public string Description { get; set; } // Может отличаться от Design.Description
        public decimal Price { get; set; }
        public string Tags { get; set; } // Например, "funny,t-shirt,custom" (строка с разделителями или JSON)
        public Guid AuthorId { get; set; }
        public DateTime AddedToCatalogAt { get; set; }
        public decimal? DiscountedPrice { get; set; }

        public Design Design { get; set; }
        public User Author { get; set; }
    }
}