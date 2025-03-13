namespace DevAPI.Models.DTOs
{
    public class ApproveDesignRequest
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public string Tags { get; set; }
        public string ModeratorComment { get; set; }
    }
}
