namespace DevAPI.Models.DTOs
{
    public class AdminActionLogDto
    {
        public Guid Id { get; set; }
        public Guid AdminId { get; set; }
        public string AdminName { get; set; }
        public string ActionType { get; set; }
        public string EntityType { get; set; }
        public Guid? EntityId { get; set; }
        public string Details { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
