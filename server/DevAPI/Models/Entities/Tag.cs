namespace DevAPI.Models.Entities
{
    public class Tag
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public List<CatalogItemTag> CatalogItemTags { get; set; } = new List<CatalogItemTag>();
    }
}
