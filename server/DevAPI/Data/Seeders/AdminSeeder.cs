using DevAPI.Models.Entities;
using Microsoft.AspNetCore.Identity;
using DevAPI.Services.Interfaces;
using DevAPI.Models.Enums;
using System.Text.Json;

namespace DevAPI.Data.Seeders
{
    public static class AdminSeeder
    {
        public static async Task SeedAdminAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<Role>>();
            var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();

            // Убедимся, что существует роль администратора
            const string adminRoleName = "Admin";
            if (!await roleManager.RoleExistsAsync(adminRoleName))
            {
                var adminRole = new Role
                {
                    Name = adminRoleName,
                    Description = "Полный доступ к системе",
                    Permissions = JsonSerializer.Serialize(Permissions.AdminPermissions)
                };

                await roleManager.CreateAsync(adminRole);
            }

            // Убедимся, что существует пользователь-администратор
            const string adminEmail = "admin@example.com";
            const string adminPassword = "Admin@123"; // Обязательно измените на сложный пароль!

            if (await userManager.FindByEmailAsync(adminEmail) == null)
            {
                var adminUser = new User
                {
                    UserName = "admin",
                    Email = adminEmail,
                    FirstName = "System",
                    LastName = "Administrator",
                    RegistrationDate = DateTime.UtcNow,
                    RefreshToken = tokenService.GenerateRefreshToken(),
                    RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7)
                };

                var result = await userManager.CreateAsync(adminUser, adminPassword);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, adminRoleName);
                    Console.WriteLine("Администратор создан!");
                }
                else
                {
                    Console.WriteLine("Не удалось создать администратора:");
                    foreach (var error in result.Errors)
                    {
                        Console.WriteLine($"- {error.Description}");
                    }
                }
            }
            else
            {
                Console.WriteLine("Администратор уже существует.");
            }
        }
    }
}
