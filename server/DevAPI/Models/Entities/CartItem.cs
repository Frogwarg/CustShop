namespace DevAPI.Models.Entities
{
    public class CartItem
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid DesignId { get; set; }
        public int Quantity { get; set; }
        public DateTime CreatedAt { get; set; }

        public User User { get; set; }
        public Design Design { get; set; }
    }
}
