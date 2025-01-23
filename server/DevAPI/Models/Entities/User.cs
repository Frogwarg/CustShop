using Microsoft.AspNetCore.Identity;

namespace DevAPI.Models.Entities
{
    public class User: IdentityUser<Guid>
    {
        //public Guid Id { get; set; }
        //public string Email { get; set; }
        //public string PasswordHash { get; set; }
        public string RefreshToken { get; set; }
        public DateTime RefreshTokenExpiryTime { get; set; }
        public UserProfile UserProfile { get; set; }

        // Custom properties
        public string FirstName { get; set; }
        public string LastName { get; set; }
        //public string PhoneNumber { get; set; }
        public ICollection<SavedAddress> SavedAddresses { get; set; }
        public DateTime RegistrationDate { get; set; }

        // Navigation properties
        public ICollection<Order> Orders { get; set; }
        public ICollection<Design> Designs { get; set; }
        public ICollection<CartItem> CartItems { get; set; }
    }
}
