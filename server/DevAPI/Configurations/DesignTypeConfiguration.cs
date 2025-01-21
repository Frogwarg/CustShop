using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using DevAPI.Models.Entities;

namespace DevAPI.Configurations
{
    public class DesignTypeConfiguration : IEntityTypeConfiguration<DesignType>
    {
        public void Configure(EntityTypeBuilder<DesignType> builder)
        {
            builder.HasKey(dt => dt.Id);

            builder.Property(dt => dt.Name).IsRequired().HasMaxLength(100);
            builder.Property(dt => dt.Description).HasMaxLength(500);
            builder.Property(dt => dt.BasePrice).HasColumnType("decimal(18,2)");

            builder.HasMany(dt => dt.Designs)
                .WithOne(d => d.DesignType)
                .HasForeignKey(d => d.DesignTypeId);
        }
    }
}
