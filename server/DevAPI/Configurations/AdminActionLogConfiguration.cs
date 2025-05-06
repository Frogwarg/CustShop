using DevAPI.Models.Entities;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;

namespace DevAPI.Configurations
{
    public class AdminActionLogConfiguration : IEntityTypeConfiguration<AdminActionLog>
    {
        public void Configure(EntityTypeBuilder<AdminActionLog> builder)
        {
            builder.HasKey(l => l.Id);

            builder.Property(l => l.ActionType).IsRequired().HasMaxLength(100);
            builder.Property(l => l.EntityType).IsRequired().HasMaxLength(100);
            builder.Property(l => l.Details).HasMaxLength(1000);

            builder.HasOne(l => l.Admin)
                .WithMany()
                .HasForeignKey(l => l.AdminId);
        }
    }
}
