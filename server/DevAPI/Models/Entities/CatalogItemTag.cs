namespace DevAPI.Models.Entities
{
    public class CatalogItemTag
    {
        public Guid CatalogItemId { get; set; }
        public CatalogItem CatalogItem { get; set; }
        public Guid TagId { get; set; }
        public Tag Tag { get; set; }
    }
}
