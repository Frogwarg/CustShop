using DevAPI.Controllers;
using DevAPI.Models.DTOs;

namespace DevAPI.Services.Interfaces
{
    public interface IDesignService
    {
        Task SubmitForModeration(Guid designId, Guid userId, ShareDesignRequest request);
        Task<List<DesignDto>> GetPendingDesigns();
        Task ApproveDesign(Guid designId, string moderatorComment);
        Task RejectDesign(Guid designId, string moderatorComment);
    }
}
