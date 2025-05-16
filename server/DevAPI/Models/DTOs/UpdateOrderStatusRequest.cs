namespace DevAPI.Models.DTOs
{
    public class UpdateOrderStatusRequest
    {
        public string Status { get; set; }
        public string PaymentStatus { get; set; }
        public string AdminComment { get; set; }
    }
}
