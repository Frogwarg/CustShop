using DevAPI.Services.Interfaces;

namespace DevAPI.Services.Implementations
{
    public class ImgBBStorageService : IImageStorageService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public ImgBBStorageService(IConfiguration configuration, HttpClient httpClient)
        {
            _httpClient = httpClient;
            _apiKey = configuration["ImgBB:ApiKey"];
        }

        public async Task<string> UploadImageAsync(string base64Image)
        {
            try
            {
                // Убираем префикс data:image/...;base64,
                var base64Data = base64Image.Contains(",")
                    ? base64Image.Substring(base64Image.IndexOf(",") + 1)
                    : base64Image;

                var content = new MultipartFormDataContent();
                content.Add(new StringContent(_apiKey), "key");
                content.Add(new StringContent(base64Data), "image");

                var response = await _httpClient.PostAsync("https://api.imgbb.com/1/upload", content);

                if (!response.IsSuccessStatusCode)
                {
                    throw new Exception($"ImgBB вернул статус: {response.StatusCode}");
                }

                var result = await response.Content.ReadFromJsonAsync<ImgBBResponse>();
                return result?.Data?.Url ?? throw new Exception("URL изображения не получен");
            }
            catch (Exception ex)
            {
                throw new Exception($"Ошибка при загрузке изображения: {ex.Message}");
            }
        }
    }

    public class ImgBBResponse
    {
        public ImgBBData Data { get; set; }
    }

    public class ImgBBData
    {
        public string Url { get; set; }
    }
}
