﻿namespace DevAPI.Models.Entities
{
    public class Address
    {
        public Guid Id { get; set; }
        public string Street { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string PostalCode { get; set; }
        public string Country { get; set; }

        public ICollection<SavedAddress> SavedAddresses { get; set; }
        public ICollection<Order> Orders { get; set; }
    }
}
