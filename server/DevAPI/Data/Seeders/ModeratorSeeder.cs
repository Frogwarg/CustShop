using DevAPI.Models.Entities;
using DevAPI.Services.Interfaces;
using DevAPI.Models.Enums;
using Microsoft.AspNetCore.Identity;
using System.Text.Json;

namespace DevAPI.Data.Seeders
{
    public static class ModeratorSeeder
    {
        public static async Task SeedModeratorAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<Role>>();
            var tokenService = scope.ServiceProvider.GetRequiredService<ITokenService>();

            // Убедимся, что существует роль модератора
            const string moderatorRoleName = "Moderator";
            if (!await roleManager.RoleExistsAsync(moderatorRoleName))
            {
                var moderatorRole = new Role
                {
                    Name = moderatorRoleName,
                    Description = "Модерация заказов и дизайнов",
                    Permissions = JsonSerializer.Serialize(Permissions.ModeratorPermissions)
                };

                await roleManager.CreateAsync(moderatorRole);
            }

            // Убедимся, что существует пользователь-модератор
            const string moderatorEmail = "moderator@example.com";
            const string moderatorPassword = "Moderator@123"; // Обязательно измените на сложный пароль!

            if (await userManager.FindByEmailAsync(moderatorEmail) == null)
            {
                var moderatorUser = new User
                {
                    UserName = "moderator",
                    Email = moderatorEmail,
                    FirstName = "Moderator",
                    LastName = "User",
                    RegistrationDate = DateTime.UtcNow,
                    RefreshToken = tokenService.GenerateRefreshToken(),
                    RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7)
                };

                var result = await userManager.CreateAsync(moderatorUser, moderatorPassword);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(moderatorUser, moderatorRoleName);
                    Console.WriteLine("Модератор создан!");
                }
                else
                {
                    Console.WriteLine("Не удалось создать модератора:");
                    foreach (var error in result.Errors)
                    {
                        Console.WriteLine($"- {error.Description}");
                    }
                }
            }
            else
            {
                Console.WriteLine("Модератор уже существует.");
            }
        }
    }
}