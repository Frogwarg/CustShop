using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace DevAPI.Models.Entities
{
    public class Design
    {
        public Guid Id { get; set; }
        public Guid? UserId { get; set; }
        public Guid DesignTypeId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }

        [Column(TypeName = "jsonb")]
        public string DesignData { get; set; } // JSON data
        public string DesignHash { get; set; }
        public string PreviewUrl { get; set; }
        public string ProductType { get; set; }
        public DateTime CreatedAt { get; set; }

        public string ModerationStatus { get; set; } = "Draft"; // "Draft", "Pending", "Approved", "Rejected"
        public DateTime? SubmittedForModerationAt { get; set; }
        public string ModeratorComment { get; set; } = string.Empty;

        public User User { get; set; }
        public DesignType DesignType { get; set; }
        public ICollection<DesignHistory> DesignHistories { get; set; }
        public ICollection<CartItem> CartItems { get; set; }
    }
}
