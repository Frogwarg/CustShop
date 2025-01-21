using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using DevAPI.Models.Entities;

namespace DevAPI.Configurations
{
    public class AddressConfiguration : IEntityTypeConfiguration<Address>
    {
        public void Configure(EntityTypeBuilder<Address> builder)
        {
            builder.HasKey(a => a.Id);

            builder.Property(a => a.Street).IsRequired().HasMaxLength(200);
            builder.Property(a => a.City).IsRequired().HasMaxLength(100);
            builder.Property(a => a.State).HasMaxLength(100);
            builder.Property(a => a.PostalCode).HasMaxLength(20);
            builder.Property(a => a.Country).IsRequired().HasMaxLength(100);

            builder.HasMany(a => a.SavedAddresses)
                .WithOne(sa => sa.Address)
                .HasForeignKey(sa => sa.AddressId);

            builder.HasMany(a => a.Orders)
                .WithOne(o => o.Address)
                .HasForeignKey(o => o.AddressId);
        }
    }
}
