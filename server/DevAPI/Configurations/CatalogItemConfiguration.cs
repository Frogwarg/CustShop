using DevAPI.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System.Reflection.Emit;

namespace DevAPI.Configurations
{
    public class CatalogItemConfiguration: IEntityTypeConfiguration<CatalogItem>
    {
        public void Configure(EntityTypeBuilder<CatalogItem> builder) {
            builder.HasOne(c => c.Design)
                .WithMany()
                .HasForeignKey(c => c.DesignId);

            builder.HasOne(c => c.Author)
                .WithMany()
                .HasForeignKey(c => c.AuthorId);
        }
    }
}
