namespace DevAPI.Models.DTOs
{
    public class ProfileOrderDto
    {
        public string Id { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; }
        public string PaymentStatus { get; set; }
        public string DeliveryMethod { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<OrderItemDto> OrderItems { get; set; }
    }

    public class ProfileOrderItemDto
    {
        public string DesignName { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string PreviewUrl { get; set; }
    }
}
