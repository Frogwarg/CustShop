using DevAPI.Data;
using DevAPI.Data.Seeders;
using DevAPI.Models.Entities;
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
builder.Services.AddDbContext<StoreDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJS", builder =>
    {
        builder.WithOrigins("http://localhost:3000") // URL Next.js
               .AllowAnyHeader()
               .AllowAnyMethod();
    });
});
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
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JWT:Secret"])),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// Регистрируем сервисы
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<RoleManager<Role>>();

builder.Services.AddControllers();

var app = builder.Build();

await RoleSeeder.SeedRoles(app.Services);

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