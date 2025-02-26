using System.Text.Json;

namespace DevAPI.Models.Entities
{
    public class Design
    {
        public Guid Id { get; set; }
        public Guid? UserId { get; set; }
        public Guid DesignTypeId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public JsonDocument DesignData { get; set; } // JSON data
        public string PreviewUrl { get; set; }
        public string ProductType { get; set; }
        public DateTime CreatedAt { get; set; }

        public User User { get; set; }
        public DesignType DesignType { get; set; }
        public ICollection<DesignHistory> DesignHistories { get; set; }
        public ICollection<CartItem> CartItems { get; set; }
    }
}
