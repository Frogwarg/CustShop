namespace DevAPI.Models.Entities
{
    public class Order
    {
        public Guid Id { get; set; }
        public Guid? UserId { get; set; }
        public Guid AddressId { get; set; }
        public Guid? DiscountId { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public string Status { get; set; } // "Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"
        public string PaymentStatus { get; set; } // "Pending", "Paid", "Failed"
        public string DeliveryMethod { get; set; } // "Delivery" or "Pickup"
        public DateTime CreatedAt { get; set; }
        public string? OrderComment { get; set; }
        public string? AdminComment { get; set; }

        public User? User { get; set; }
        public Address Address { get; set; }
        public Discount Discount { get; set; }
        public ICollection<OrderItem> OrderItems { get; set; }
    }
}
