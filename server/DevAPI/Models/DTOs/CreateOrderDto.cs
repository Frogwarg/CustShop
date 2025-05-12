namespace DevAPI.Models.DTOs
{
    public class CreateOrderDto
    {
        public string DeliveryMethod { get; set; } // "Delivery" или "Pickup"
        public string OrderComment { get; set; }
        public AddressDto Address { get; set; }
        public string DiscountCode { get; set; }
        public UserInfoDto UserInfo { get; set; }
    }

    public class UserInfoDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string MiddleName { get; set; } // Отчество
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
    }
}
