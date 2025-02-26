namespace DevAPI.Services.Interfaces
{
    public interface IImageStorageService
    {
        Task<string> UploadImageAsync(string base64Image);
    }
}
