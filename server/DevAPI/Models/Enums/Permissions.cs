namespace DevAPI.Models.Enums
{
    [Flags]
    public enum Permissions
    {
        None = 0,

        // Права для работы с пользователями
        ViewUsers = 1 << 0,
        EditUsers = 1 << 1,
        DeleteUsers = 1 << 2,

        // Права для работы с заказами
        ViewOrders = 1 << 3,
        ManageOrders = 1 << 4,  // изменение статуса, отмена и т.д.

        // Права для работы с товарами
        ViewProducts = 1 << 5,
        EditProducts = 1 << 6,
        DeleteProducts = 1 << 7,

        // Права для работы с дизайнами
        ViewDesigns = 1 << 8,
        CreateDesigns = 1 << 9,
        ModerateDesigns = 1 << 10,  // проверка и публикация дизайнов
        PublishDesigns = 1 << 11,   // возможность публиковать свои дизайны

        // Комбинации прав для разных ролей
        AdminPermissions = ViewUsers | EditUsers | DeleteUsers |
                         ViewOrders | ManageOrders |
                         ViewProducts | EditProducts | DeleteProducts |
                         ViewDesigns | ModerateDesigns,

        ModeratorPermissions = ViewOrders | ManageOrders |
                              ViewProducts | ViewDesigns | ModerateDesigns,

        CreatorPermissions = ViewProducts | ViewDesigns | CreateDesigns | PublishDesigns,

        UserPermissions = ViewProducts | ViewDesigns | CreateDesigns
    }
}
