using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using DevAPI.Models.Entities;

namespace DevAPI.Configurations
{
    public class DesignConfiguration : IEntityTypeConfiguration<Design>
    {
        public void Configure(EntityTypeBuilder<Design> builder)
        {
            builder.HasKey(d => d.Id);

            builder.Property(d => d.Name).IsRequired().HasMaxLength(200);
            builder.Property(d => d.Description).HasMaxLength(1000);
            builder.Property(d => d.DesignData).HasColumnType("json");

            builder.HasOne(d => d.User)
                .WithMany(u => u.Designs)
                .HasForeignKey(d => d.UserId);

            builder.HasOne(d => d.DesignType)
                .WithMany(dt => dt.Designs)
                .HasForeignKey(d => d.DesignTypeId);

            builder.HasMany(d => d.DesignHistories)
                .WithOne(dh => dh.Design)
                .HasForeignKey(dh => dh.DesignId);

            builder.HasMany(d => d.CartItems)
                .WithOne(ci => ci.Design)
                .HasForeignKey(ci => ci.DesignId);
        }
    }
}
