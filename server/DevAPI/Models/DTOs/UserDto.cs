namespace DevAPI.Models.DTOs
{
    public class UserDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string MiddleName { get; set; }
        public string PhoneNumber { get; set; }
        public string Bio { get; set; }
        public IList<string> Roles { get; set; }
        public bool IsLockedOut { get; set; }
    }
}
