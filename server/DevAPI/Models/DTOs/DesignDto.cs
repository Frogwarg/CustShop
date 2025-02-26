using System.Text.Json;

namespace DevAPI.Models.DTOs
{
    public class DesignDto
    {
        public string Name { get; set; } = "Новый дизайн"; // Добавляем дефолтное значение
        public string Description { get; set; } = ""; // Добавляем дефолтное значение
        public string PreviewUrl { get; set; }
        public JsonDocument DesignData { get; set; }
        
        public string ProductType { get; set; } = "shirt";
        public string DesignType { get; set; } = "Custom"; // Добавляем дефолтное значение
    }
}
