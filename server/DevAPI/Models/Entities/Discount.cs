namespace DevAPI.Models.Entities
{
    public class Discount
    {
        public Guid Id { get; set; }
        public string Code { get; set; }
        public decimal Amount { get; set; }
        public string DiscountType { get; set; }
        public DateTime ValidFrom { get; set; }
        public DateTime ValidTo { get; set; }
        public int UsageLimit { get; set; }
        public int TimesUsed { get; set; }

        public ICollection<Order> Orders { get; set; }
    }
}
