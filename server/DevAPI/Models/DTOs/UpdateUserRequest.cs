namespace DevAPI.Models.DTOs
{
    public class UpdateUserRequest
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string MiddleName { get; set; }
        public string PhoneNumber { get; set; }
        public string Bio { get; set; }
        public List<string> Roles { get; set; }
    }
}
