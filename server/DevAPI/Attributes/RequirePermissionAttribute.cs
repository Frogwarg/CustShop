using DevAPI.Models.Enums;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc;

namespace DevAPI.Attributes
{
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, Inherited = false)]
    public class RequirePermissionAttribute : Attribute, IAuthorizationFilter
    {
        private readonly Permissions _requiredPermission;

        public RequirePermissionAttribute(Permissions permission)
        {
            _requiredPermission = permission;
        }

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            var user = context.HttpContext.User;
            if (!user.Identity.IsAuthenticated)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            var userPermissionsClaim = user.FindFirst("Permissions");
            if (userPermissionsClaim == null)
            {
                context.Result = new ForbidResult();
                return;
            }

            var userPermissions = Enum.Parse<Permissions>(userPermissionsClaim.Value);
            if ((userPermissions & _requiredPermission) != _requiredPermission)
            {
                context.Result = new ForbidResult();
            }
        }
    }
}
