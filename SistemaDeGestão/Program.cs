using Amazon.S3;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SistemaDeGestão.Configurations;
using SistemaDeGestão.Data;
using SistemaDeGestão.Repository;
using SistemaDeGestão.Services;
using SistemaDeGestão.Services.Implementations;
using SistemaDeGestão.Services.Interfaces;
using System.Text;
using System.Text.Json;
using Amazon;
using SistemaDeGestão.AutoMapper;
using Microsoft.AspNetCore.Hosting;
using System.Net;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.Swagger;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();
//db connection 

//Mysql Prod
var connection = builder.Configuration["ConnectionStrings:DefaultConnection"];
builder.Services.AddDbContext<DataBaseContext>(options => options.UseMySql(connection,
    new MySqlServerVersion(
        new Version(8, 0, 0)))); 

//sqlServer Prod
/*var connection = builder.Configuration["ConnectionStrings:DefaultConnection"];
builder.Services.AddDbContext<DataBaseContext>(options =>
    options.UseSqlServer(connection));*/

//Seguranca
var tokenConfigurations = new TokenConfiguration();
new ConfigureFromConfigurationOptions<TokenConfiguration>(
        builder.Configuration.GetSection("TokenConfigurations")
        ).Configure(tokenConfigurations);

builder.Services.AddSingleton(tokenConfigurations);

//parametros de autenticacao
builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    }).AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = tokenConfigurations.Issuer,
            ValidAudience = tokenConfigurations.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(tokenConfigurations.Secret))
        };
        // Evento para capturar o token do cookie
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var token = context.Request.Cookies["AuthToken"];
                if (!string.IsNullOrEmpty(token))
                {
                    context.Token = token;
                }
                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization(auth =>
    {
        auth.AddPolicy("Bearer", new AuthorizationPolicyBuilder()
            .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme)
            .RequireAuthenticatedUser().Build());
    });
//Injecao de dependencia
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ILoginService, LoginServiceImplementation>();
builder.Services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
//dependencias de Service
builder.Services.AddScoped<RestauranteService>();
builder.Services.AddScoped<ProdutoService>();
builder.Services.AddScoped<ComplementoService>();
builder.Services.AddScoped<CategoriaService>();
builder.Services.AddScoped<AdicionalService>();
builder.Services.AddScoped<PedidoService>();
builder.Services.AddScoped<IFinalUserService, FinalUserService>();
builder.Services.AddScoped<FinalUserService>();
builder.Services.AddScoped<MercadoPagoService>();
builder.Services.AddAutoMapper(typeof(MappingProfile));
builder.Services.AddScoped<IEncryptionService, EncryptionService>();
builder.Services.AddHttpClient();
builder.Services.AddSingleton<IAmazonS3>(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();

    var accessKey = configuration["AWS:Credentials:AccessKey"];
    var secretKey = configuration["AWS:Credentials:SecretKey"];
    var region = RegionEndpoint.USEast1; // Região correta: us-east-1

    return new AmazonS3Client(accessKey, secretKey, region);
});

builder.Services.AddScoped<IImageUploadService, ImageUploadService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddSession();
builder.Services.AddHttpContextAccessor();
//Order Hub
builder.Services.AddSignalR();
//referencia ciclica solucao
builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve;
            options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        });
/*builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/Auth/Login";  // Caminho para o redirecionamento de login
}); */

//Usar local
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin",
        builder =>
        {
            builder
                .SetIsOriginAllowed(_ => true) 
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        });
});

//Usar em prod
/*builder.Services.AddCors(options => {
    options.AddPolicy("AllowSpecificOrigin", builder => {
        builder
            .WithOrigins("https://sistema-de-gestao-v3.vercel.app") // More secure than allowing any origin
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
}); */

//OrderHub
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
    options.MaximumReceiveMessageSize = 32 * 1024; // 32KB
});

//swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Minha API", Version = "v1" });
});

builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.ConfigureHttpsDefaults(opts =>
    {
        opts.SslProtocols = System.Security.Authentication.SslProtocols.Tls12 |
                            System.Security.Authentication.SslProtocols.Tls13;
    });
});

var app = builder.Build();


// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}
//swagger
app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Minha API v1"));

app.UseDeveloperExceptionPage();
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("AllowFrontend");
app.UseCors("AllowSpecificOrigin");
app.UseRouting();
app.UseStaticFiles();
app.UseCors();
app.UseAuthentication(); // Adicione isso
app.UseAuthorization();  // E isso também
app.UseSession();
app.MapControllers();
//Order Hub
app.MapHub<OrderHub>("/orderHub");

app.MapControllerRoute(
    name: "loja",
    pattern: "{id}/{nomeDaLoja}",
    defaults: new { controller = "Loja", action = "Index" });

app.MapControllerRoute(
    name: "default",
    pattern: "",
    defaults: new { area = "Admin", controller = "Produto", action = "Index" });

app.MapControllerRoute(
    name: "Area",
    pattern: "{area:exists}/{controller=Produto}/{action=Index}/{id?}");

app.MapAreaControllerRoute(
    name: "admin",
    areaName: "Admin",
    pattern: "admin/{controller=Produto}/{action=Index}/{id?}");



app.Run();
