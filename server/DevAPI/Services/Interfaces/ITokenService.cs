using DevAPI.Models.Entities;
using System.Security.Claims;

namespace DevAPI.Services.Interfaces
{
    public interface ITokenService
    {
        string GenerateJwtToken(User user, IList<string> roles);
        string GenerateRefreshToken();
        ClaimsPrincipal GetPrincipalFromExpiredToken(string token);
    }
}
