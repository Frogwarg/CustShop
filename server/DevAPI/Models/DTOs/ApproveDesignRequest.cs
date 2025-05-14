namespace DevAPI.Models.DTOs
{
    public class ApproveDesignRequest
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public List<Guid> TagIds { get; set; } = new List<Guid>();
        public string ModeratorComment { get; set; }
    }
}
