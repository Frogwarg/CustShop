using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using DevAPI.Models.Entities;

namespace DevAPI.Configurations
{
    public class SavedAddressConfiguration : IEntityTypeConfiguration<SavedAddress>
    {
        public void Configure(EntityTypeBuilder<SavedAddress> builder)
        {
            builder.HasKey(sa => sa.Id);

            builder.HasOne(sa => sa.User)
                .WithMany(u => u.SavedAddresses)
                .HasForeignKey(sa => sa.UserId);

            builder.HasOne(sa => sa.Address)
                .WithMany(a => a.SavedAddresses)
                .HasForeignKey(sa => sa.AddressId);
        }
    }
}
