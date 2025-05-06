namespace DevAPI.Models.Entities
{
    public class AdminActionLog
    {
        public Guid Id { get; set; }
        public Guid AdminId { get; set; }
        public string ActionType { get; set; } // "UpdateUser", "ChangeOrderStatus", "ApproveDesign", etc.
        public string EntityType { get; set; } // "User", "Order", "Design", etc.
        public Guid? EntityId { get; set; } // ID сущности, если применимо
        public string Details { get; set; } // JSON или текст с деталями
        public DateTime CreatedAt { get; set; }

        public User Admin { get; set; }
    }
}
