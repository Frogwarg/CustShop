namespace DevAPI.Models.DTOs
{
    public class OrderDto
    {
        public Guid Id { get; set; }
        public string UserEmail { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public string Status { get; set; }
        public string PaymentStatus { get; set; }
        public DateTime CreatedAt { get; set; }
        public string AdminComment { get; set; }
        public int ItemCount { get; set; }
    }
}