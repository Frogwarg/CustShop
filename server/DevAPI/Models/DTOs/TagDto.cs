namespace DevAPI.Models.DTOs
{
    public class TagDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
    }

    public class CreateTagRequest
    {
        public string Name { get; set; }
    }

    public class UpdateTagRequest
    {
        public string Name { get; set; }
    }
}
