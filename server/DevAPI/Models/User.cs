namespace DevAPI.Models
{
    public class User
    {
        public Guid Id { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Phone { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public ICollection<Order> Orders { get; set; }
        public ICollection<Design> Designs { get; set; }
        public ICollection<CartItem> CartItems { get; set; }
        public ICollection<SavedAddress> SavedAddresses { get; set; }
        public UserProfile UserProfile { get; set; }
        public ICollection<UserRole> UserRoles { get; set; }
    }
}
