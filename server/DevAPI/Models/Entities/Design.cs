namespace DevAPI.Models.Entities
{
    public class Design
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid DesignTypeId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string DesignData { get; set; } // JSON data
        public bool IsTemplate { get; set; }
        public bool IsPublic { get; set; }
        public DateTime CreatedAt { get; set; }

        public User User { get; set; }
        public DesignType DesignType { get; set; }
        public ICollection<DesignHistory> DesignHistories { get; set; }
        public ICollection<CartItem> CartItems { get; set; }
    }
}
