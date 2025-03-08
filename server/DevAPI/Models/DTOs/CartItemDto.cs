using DevAPI.Models.Entities;

namespace DevAPI.Models.DTOs
{
    public class CartItemDto
    {
        public Guid Id { get; set; }
        public DesignDto Design { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
    }
} 