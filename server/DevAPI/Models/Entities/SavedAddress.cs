namespace DevAPI.Models.Entities
{
    public class SavedAddress
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid AddressId { get; set; }
        public string Label { get; set; }

        public User User { get; set; }
        public Address Address { get; set; }
    }
}
