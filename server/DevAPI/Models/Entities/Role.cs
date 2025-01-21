using Microsoft.AspNetCore.Identity;

namespace DevAPI.Models.Entities
{
    public class Role: IdentityRole<Guid>
    {
        //public Guid Id { get; set; }
        //public string Name { get; set; }
        public string Description { get; set; }
        public string? Permissions { get; set; } // JSON data

        public ICollection<UserRole>? UserRoles { get; set; }
    }
}
