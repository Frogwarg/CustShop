namespace DevAPI.Models.Entities
{
    public class DesignHistory
    {
        public Guid Id { get; set; }
        public Guid DesignId { get; set; }
        public Guid UserId { get; set; }
        public string Changes { get; set; } // JSON data
        public string Action { get; set; }
        public DateTime CreatedAt { get; set; }

        public Design Design { get; set; }
        public User User { get; set; }
    }
}
