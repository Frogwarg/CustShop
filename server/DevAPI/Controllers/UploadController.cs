using DevAPI.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using DevAPI.Models.DTOs;

namespace DevAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly IImageStorageService _imageService;

        public UploadController(IImageStorageService imageService)
        {
            _imageService = imageService;
        }

        [HttpPost("design-preview")]
        public async Task<IActionResult> UploadDesignPreview([FromBody] UploadImageDto request)
        {
            try
            {
                var imageUrl = await _imageService.UploadImageAsync(request.ImageData);
                return Ok(new { imageUrl });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при загрузке превью: {ex.Message}");
            }
        }

        //[HttpPost("avatar")]
        //public async Task<IActionResult> UploadAvatar([FromBody] UploadImageDto request)
        //{
        //    try
        //    {
        //        var imageUrl = await _imageService.UploadImageAsync(request.ImageData, "avatars");
        //        return Ok(new { imageUrl });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, $"Ошибка при загрузке аватара: {ex.Message}");
        //    }
        //}
    }
}
