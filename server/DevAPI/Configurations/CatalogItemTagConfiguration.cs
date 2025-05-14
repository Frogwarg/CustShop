using DevAPI.Models.Entities;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore;

namespace DevAPI.Configurations
{
    public class CatalogItemTagConfiguration : IEntityTypeConfiguration<CatalogItemTag>
    {
        public void Configure(EntityTypeBuilder<CatalogItemTag> builder)
        {
            builder.HasKey(cit => new { cit.CatalogItemId, cit.TagId });

            builder.HasOne(cit => cit.CatalogItem)
                .WithMany(ci => ci.CatalogItemTags)
                .HasForeignKey(cit => cit.CatalogItemId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(cit => cit.Tag)
                .WithMany(t => t.CatalogItemTags)
                .HasForeignKey(cit => cit.TagId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
