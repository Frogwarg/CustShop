namespace DevAPI.Models.Entities
{
    public class CartItem
    {
        public Guid Id { get; set; }
        public Guid? UserId { get; set; }
        public Guid DesignId { get; set; }
        public string? SessionId { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public User? User { get; set; }
        public Design Design { get; set; }
    }
}
