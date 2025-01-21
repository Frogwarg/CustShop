using Microsoft.AspNetCore.Identity;

namespace DevAPI.Models.Entities
{
    public class UserRole: IdentityUserRole<Guid>
    {
        //public Guid Id { get; set; }
        //public Guid UserId { get; set; }
        //public Guid RoleId { get; set; }
        //public DateTime AssignedAt { get; set; }

        public User User { get; set; }
        public Role Role { get; set; }
    }
}
