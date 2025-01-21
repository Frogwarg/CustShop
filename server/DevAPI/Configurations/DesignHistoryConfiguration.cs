using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;
using DevAPI.Models.Entities;

namespace DevAPI.Configurations
{
    public class DesignHistoryConfiguration : IEntityTypeConfiguration<DesignHistory>
    {
        public void Configure(EntityTypeBuilder<DesignHistory> builder)
        {
            builder.HasKey(dh => dh.Id);

            builder.Property(dh => dh.Changes).HasColumnType("json");
            builder.Property(dh => dh.Action).HasMaxLength(100);

            builder.HasOne(dh => dh.Design)
                .WithMany(d => d.DesignHistories)
                .HasForeignKey(dh => dh.DesignId);

            builder.HasOne(dh => dh.User)
                .WithMany()
                .HasForeignKey(dh => dh.UserId);
        }
    }
}
