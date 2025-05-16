using DevAPI.Data;
using DevAPI.Models.DTOs;
using DevAPI.Models.Entities;
using DevAPI.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DevAPI.Services.Implementations
{
    public class OrderService : IOrderService
    {
        private readonly StoreDbContext _context;
        private readonly ILogger<OrderService> _logger;

        public OrderService(StoreDbContext context, ILogger<OrderService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<OrderDto> CreateOrderAsync(Guid? userId, string sessionId, CreateOrderDto request)
        {
            // Получаем элементы корзины
            var cartItems = await _context.CartItems
                .Include(c => c.Design)
                .Where(c => userId.HasValue ? c.UserId == userId : c.SessionId == sessionId)
                .ToListAsync();

            if (!cartItems.Any())
            {
                throw new Exception("Корзина пуста");
            }

            // Создаем адрес
            var address = new Address
            {
                Id = Guid.NewGuid(),
                Street = request.Address.Street,
                City = request.Address.City,
                State = request.Address.State,
                PostalCode = request.Address.PostalCode,
                Country = request.Address.Country
            };
            _context.Addresses.Add(address);

            // Проверяем скидку
            Discount? discount = null;
            if (!string.IsNullOrEmpty(request.DiscountCode))
            {
                discount = await _context.Discounts
                    .FirstOrDefaultAsync(d => d.Code == request.DiscountCode &&
                                              d.ValidFrom <= DateTime.UtcNow &&
                                              d.ValidTo >= DateTime.UtcNow &&
                                              d.TimesUsed < d.UsageLimit);
                if (discount == null)
                {
                    throw new Exception("Недействительный код скидки");
                }
            }

            // Рассчитываем стоимость
            decimal totalAmount = cartItems.Sum(c => c.Quantity * c.Price);
            decimal discountAmount = 0;
            if (discount != null)
            {
                if (discount.MinimumOrderAmount.HasValue && totalAmount < discount.MinimumOrderAmount.Value)
                {
                    throw new Exception("Сумма заказа слишком мала для применения скидки");
                }
                discountAmount = discount.DiscountType == "Percentage"
                    ? totalAmount * (discount.Amount / 100)
                    : discount.Amount;
                totalAmount -= discountAmount;
                discount.TimesUsed++;
            }

            // Создаем заказ
            var order = new Order
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AddressId = address.Id,
                DiscountId = discount?.Id,
                TotalAmount = totalAmount,
                DiscountAmount = discountAmount,
                Status = "Pending",
                PaymentStatus = "Paid", //поменять логику
                DeliveryMethod = request.DeliveryMethod,
                OrderComment = request.OrderComment,
                CreatedAt = DateTime.UtcNow,
                FirstName = request.UserInfo.FirstName,
                LastName = request.UserInfo.LastName,
                MiddleName = request.UserInfo.MiddleName,
                Email = request.UserInfo.Email,
                PhoneNumber = request.UserInfo.PhoneNumber
            };
            _context.Orders.Add(order);

            // Создаем элементы заказа
            foreach (var cartItem in cartItems)
            {
                var orderItem = new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = order.Id,
                    DesignId = cartItem.DesignId,
                    Quantity = cartItem.Quantity,
                    UnitPrice = cartItem.Price
                };
                _context.OrderItems.Add(orderItem);
            }

            // Очищаем корзину
            _context.CartItems.RemoveRange(cartItems);

            await _context.SaveChangesAsync();

            // Возвращаем DTO заказа
            return await GetOrderAsync(order.Id, userId);
        }

        public async Task<OrderDto> GetOrderAsync(Guid orderId, Guid? userId)
        {
            var query = _context.Orders
                .Include(o => o.Address)
                .Include(o => o.Discount)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Design)
                .Where(o => o.Id == orderId);
            
            if (userId.HasValue)
            {
                query = query.Where(o => o.UserId == userId);
            }
            else
            {
                query = query.Where(o => o.UserId == null);
            }

            var order = await query.FirstOrDefaultAsync();

            if (order == null)
            {
                throw new Exception("Заказ не найден");
            }

            return new OrderDto
            {
                Id = order.Id,
                TotalAmount = order.TotalAmount,
                DiscountAmount = order.DiscountAmount,
                Status = order.Status,
                PaymentStatus = order.PaymentStatus,
                DeliveryMethod = order.DeliveryMethod,
                OrderComment = order.OrderComment,
                Address = new AddressDto
                {
                    Street = order.Address.Street,
                    City = order.Address.City,
                    State = order.Address.State,
                    PostalCode = order.Address.PostalCode,
                    Country = order.Address.Country
                },
                Discount = order.Discount != null ? new DiscountDto
                {
                    Code = order.Discount.Code,
                    Amount = order.Discount.Amount,
                    DiscountType = order.Discount.DiscountType
                } : null,
                OrderItems = order.OrderItems.Select(oi => new OrderItemDto
                {
                    DesignId = oi.DesignId,
                    DesignName = oi.Design.Name,
                    PreviewUrl = oi.Design.PreviewUrl,
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice
                }).ToList(),
                CreatedAt = order.CreatedAt,
                FirstName = order.FirstName,
                LastName = order.LastName,
                MiddleName = order.MiddleName,
                Email = order.Email,
                PhoneNumber = order.PhoneNumber
            };
        }
    }
}
