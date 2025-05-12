using DevAPI.Data;
using DevAPI.Data.Seeders;
using DevAPI.Models.Entities;
using DevAPI.Services;
using DevAPI.Services.Implementations;
using DevAPI.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddLogging(configure =>
{
    configure.AddConsole(); // Вывод в консоль
    configure.AddDebug();   // Вывод отладочных сообщений
});

//builder.Services.AddSingleton<ConnectionStringSelector>();

builder.Services.AddDbContext<StoreDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

//builder.Services.AddDbContext<StoreDbContext>((serviceProvider, options) =>
//{
//    var selector = serviceProvider.GetRequiredService<ConnectionStringSelector>();
//    var connectionString = selector.GetConnectionString();
//    options.UseNpgsql(connectionString, npgsqlOptions =>
//        npgsqlOptions.EnableRetryOnFailure(
//            maxRetryCount: 5, // Максимум 5 попыток
//            maxRetryDelay: TimeSpan.FromSeconds(10), // Задержка до 10 секунд между попытками
//            errorCodesToAdd: null // Автоматически обрабатывать все транзиентные ошибки
//        ));
//});
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJS", builder =>
    {
        builder.WithOrigins("http://localhost:3000", "http://192.168.100.125:3000") // URL Next.js
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials();
    });
});
builder.WebHost.UseUrls("http://0.0.0.0:5123", "https://0.0.0.0:7036", "http://localhost:5123", "https://localhost:7036");
builder.Services.AddIdentity<User, Role>(options => {
    options.Password.RequiredLength = 8;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireDigit = true;
})
    .AddEntityFrameworkStores<StoreDbContext>()
    .AddDefaultTokenProviders();

// Настраиваем аутентификацию
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = false;
    options.TokenValidationParameters = new TokenValidationParameters()
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidAudience = builder.Configuration["JWT:ValidAudience"],
        ValidIssuer = builder.Configuration["JWT:ValidIssuer"],
        //IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JWT:Secret"])),
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            Environment.GetEnvironmentVariable("JWT_SECRET") ?? throw new InvalidOperationException("JWT_SECRET is not set"))), // Здесь используем переменную окружения
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddDistributedMemoryCache();

builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromDays(1);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// Регистрируем сервисы
builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient();
builder.Services.AddScoped<IImageStorageService, ImgBBStorageService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<IDesignService, DesignService>();
builder.Services.AddScoped<ICatalogService, CatalogService>();
builder.Services.AddScoped<RoleManager<Role>>();

builder.Services.AddControllers();

var app = builder.Build();

await RoleSeeder.SeedRoles(app.Services);
await AdminSeeder.SeedAdminAsync(app.Services);
await ModeratorSeeder.SeedModeratorAsync(app.Services);

app.UseSession();
app.UseRouting();
app.UseCors("AllowNextJS");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/routes", (IEnumerable<EndpointDataSource> endpointSources) =>
{
    var routes = endpointSources
        .SelectMany(source => source.Endpoints)
        .OfType<RouteEndpoint>()
        .Select(route => route.RoutePattern.RawText)
        .ToList();
    return routes;
});

app.Run();