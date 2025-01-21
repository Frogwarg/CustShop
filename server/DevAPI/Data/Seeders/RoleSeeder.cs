using DevAPI.Models.Entities;
using DevAPI.Models.Enums;
using System.Text.Json;
using Microsoft.AspNetCore.Identity;

namespace DevAPI.Data.Seeders
{
    public static class RoleSeeder
    {
        public static async Task SeedRoles(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<Role>>();

            var roles = new[]
            {
            new Role
            {
                Name = "Admin",
                Description = "Полный доступ к системе",
                Permissions = JsonSerializer.Serialize(Permissions.AdminPermissions)
            },
            new Role
            {
                Name = "Moderator",
                Description = "Модерация заказов и дизайнов",
                Permissions = JsonSerializer.Serialize(Permissions.ModeratorPermissions)
            },
            new Role
            {
                Name = "Creator",
                Description = "Создатель дизайнов с правом публикации",
                Permissions = JsonSerializer.Serialize(Permissions.CreatorPermissions)
            },
            new Role
            {
                Name = "User",
                Description = "Обычный пользователь",
                Permissions = JsonSerializer.Serialize(Permissions.UserPermissions)
            }
        };

            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role.Name!))
                {
                    await roleManager.CreateAsync(role);
                }
            }
        }
    }
}
