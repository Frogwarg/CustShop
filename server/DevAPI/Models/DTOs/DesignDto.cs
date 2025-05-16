using System.Text.Json;

namespace DevAPI.Models.DTOs
{
    public class DesignDto
    {
        public Guid Id { get; set; }
        public string? UserId { get; set; }
        public string? ModerationStatus { get; set; }
        public string Name { get; set; } = "Новый дизайн"; // Добавляем дефолтное значение
        public string Description { get; set; } = ""; // Добавляем дефолтное значение
        public string PreviewUrl { get; set; }
        public string DesignData { get; set; }
        public string DesignHash { get; set; }
        public DateTime CreatedAt { get; set; }
        public string ProductType { get; set; } = "shirt";
        public string DesignType { get; set; } = "Custom"; // Добавляем дефолтное значение
    }
    public class AdminDesignDto
    {
        public Guid Id { get; set; }
        public Guid? UserId { get; set; }
        public string UserName { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string ProductType { get; set; }
        public string PreviewUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public string ModerationStatus { get; set; }
        public string ModeratorComment { get; set; }
    }
}
