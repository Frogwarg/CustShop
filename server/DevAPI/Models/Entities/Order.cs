namespace DevAPI.Models.Entities
{
    public class Order
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid AddressId { get; set; }
        public Guid DiscountId { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public string Status { get; set; }
        public string PaymentStatus { get; set; }
        public DateTime CreatedAt { get; set; }

        public User User { get; set; }
        public Address Address { get; set; }
        public Discount Discount { get; set; }
        public ICollection<OrderItem> OrderItems { get; set; }
    }
}
