namespace DevAPI.Models.DTOs
{
    public class OrderDto
    {
        public Guid Id { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public string Status { get; set; }
        public string PaymentStatus { get; set; }
        public string DeliveryMethod { get; set; }
        public string OrderComment { get; set; }
        public AddressDto Address { get; set; }
        public DiscountDto? Discount { get; set; }
        public List<OrderItemDto> OrderItems { get; set; }
        public DateTime CreatedAt { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string? MiddleName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
    }
    public class AddressDto
    {
        public string? Id { get; set; }
        public string Street { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string PostalCode { get; set; }
        public string Country { get; set; }
        public string? Label { get; set; }
    }

    public class AddressRequest
    {
        public string Street { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string PostalCode { get; set; }
        public string Country { get; set; }
        public string Label { get; set; }
    }

    public class DiscountDto
    {
        public string Code { get; set; }
        public decimal Amount { get; set; }
        public string DiscountType { get; set; }
    }

    public class OrderItemDto
    {
        public Guid DesignId { get; set; }
        public string DesignName { get; set; }
        public string PreviewUrl { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
}