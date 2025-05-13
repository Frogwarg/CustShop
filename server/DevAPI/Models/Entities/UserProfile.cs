using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace DevAPI.Models.Entities
{
    public class UserProfile
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Bio { get; set; }

        public DateTime LastLogin { get; set; }

        public User User { get; set; }
    }
}
