using DevAPI.Models.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace DevAPI.Data
{
    public class StoreDbContext : IdentityDbContext<User, Role, Guid>
    {
        public StoreDbContext(DbContextOptions<StoreDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<UserProfile> UserProfiles { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<Design> Designs { get; set; }
        public DbSet<DesignHistory> DesignHistories { get; set; }
        public DbSet<DesignType> DesignTypes { get; set; }
        public DbSet<Discount> Discounts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<Address> Addresses { get; set; }
        public DbSet<SavedAddress> SavedAddresses { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Исключаем ненужные стандартные сущности
            modelBuilder.Ignore<IdentityUserLogin<Guid>>();
            modelBuilder.Ignore<IdentityUserToken<Guid>>();
            modelBuilder.Ignore<IdentityUserClaim<Guid>>();
            modelBuilder.Ignore<IdentityRoleClaim<Guid>>();
            modelBuilder.Ignore<IdentityUserRole<Guid>>();

            modelBuilder.ApplyConfiguration(new Configurations.UserConfiguration());
            modelBuilder.ApplyConfiguration(new Configurations.UserProfileConfiguration());
            modelBuilder.ApplyConfiguration(new Configurations.RoleConfiguration());
            modelBuilder.ApplyConfiguration(new Configurations.UserRoleConfiguration());
            modelBuilder.ApplyConfiguration(new Configurations.DesignConfiguration());
            modelBuilder.ApplyConfiguration(new Configurations.DesignHistoryConfiguration());
            modelBuilder.ApplyConfiguration(new Configurations.DesignTypeConfiguration());
            modelBuilder.ApplyConfiguration(new Configurations.CartItemConfiguration());
            modelBuilder.ApplyConfiguration(new Configurations.AddressConfiguration());
            modelBuilder.ApplyConfiguration(new Configurations.SavedAddressConfiguration());
            modelBuilder.ApplyConfiguration(new Configurations.OrderConfiguration());
            modelBuilder.ApplyConfiguration(new Configurations.OrderItemConfiguration());
        }

    }

}
