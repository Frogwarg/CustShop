using System.Collections.Generic;

namespace DevAPI.Models.DTOs
{
    public class AdminOrderDto { 
        public Guid Id { get; set; } 
        public decimal TotalAmount { get; set; } 
        public string Status { get; set; } 
        public string PaymentStatus { get; set; } 
        public string DeliveryMethod { get; set; } 
        public DateTime CreatedAt { get; set; } 
        public string OrderComment { get; set; } 
        public string AdminComment { get; set; } 
        public string FirstName { get; set; } 
        public string LastName { get; set; } 
        public string MiddleName { get; set; } 
        public string Email { get; set; } 
        public string PhoneNumber { get; set; } 
        public AddressDto Address { get; set; } 
        public List<OrderItemDto> OrderItems { get; set; } }
}
