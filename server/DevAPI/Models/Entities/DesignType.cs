namespace DevAPI.Models.Entities
{
    public class DesignType
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal BasePrice { get; set; }
        public string Constraints { get; set; } // JSON data

        public ICollection<Design> Designs { get; set; }
    }
}
