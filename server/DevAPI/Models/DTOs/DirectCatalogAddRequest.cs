namespace DevAPI.Models.DTOs
{
    public class DirectCatalogAddRequest
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string PreviewUrl { get; set; }
        public string DesignData { get; set; }
        public string DesignHash { get; set; }
        public string? ProductType { get; set; }
        public string ModerationStatus { get; set; }
        public decimal Price { get; set; }
        public List<Guid> TagIds { get; set; } = new List<Guid>();
    }
}
