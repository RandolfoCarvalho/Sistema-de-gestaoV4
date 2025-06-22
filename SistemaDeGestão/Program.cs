using Amazon.S3;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SistemaDeGestao.Configurations;
using SistemaDeGestao.Data;
using SistemaDeGestao.Repository;
using SistemaDeGestao.Services;
using SistemaDeGestao.Services.Implementations;
using SistemaDeGestao.Services.Interfaces;
using System.Text;
using System.Text.Json;
using Amazon;
using SistemaDeGestao.AutoMapper;
using Microsoft.AspNetCore.Hosting;
using System.Net;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.Swagger;
using Microsoft.Extensions.Logging;
using Serilog;
using Microsoft.AspNetCore.Localization;
using System.Globalization;
using SistemaDeGestao.Interfaces;
using StackExchange.Redis;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using SistemaDeGestao.Hubs;

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

var secretKey = string.IsNullOrEmpty(tokenConfigurations.Secret) 
    ? "DEFAULT_FALLBACK_SECRET_KEY_FOR_DEVELOPMENT"  // Fallback value
    : tokenConfigurations.Secret;

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
        ValidIssuer = tokenConfigurations.Issuer ?? "DefaultIssuer",
        ValidAudience = tokenConfigurations.Audience ?? "DefaultAudience",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        NameClaimType = ClaimTypes.Name,
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
builder.Services.AddScoped<IMercadoPagoService, MercadoPagoService>();
//PaymentOrchestrator
builder.Services.AddScoped<IPagamentoOrchestratorService, PagamentoOrchestratorService>();
// 2. Registro do Cliente de API do Mercado Pago com IHttpClientFactory
builder.Services.AddHttpClient<IMercadoPagoApiClient, MercadoPagoApiClient>();

// 3. Configuração do Cache Distribuído (Redis é o recomendado)
builder.Services.AddStackExchangeRedisCache(options =>
{
    // Pega a connection string do seu appsettings.json
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
    options.InstanceName = "SistemaDeGestao_";
});

builder.Services.AddHttpClient<WhatsAppBotService>();
builder.Services.AddAutoMapper(typeof(MappingProfile));
builder.Services.AddScoped<IEncryptionService, EncryptionService>();
builder.Services.AddHttpClient();
builder.Services.AddSingleton<IAmazonS3>(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();

    var accessKey = configuration["AWS:Credentials:AccessKey"];
    var secretKey = configuration["AWS:Credentials:SecretKey"];
    var region = RegionEndpoint.USEast1; // Regiao correta: us-east-1

    return new AmazonS3Client(accessKey, secretKey, region);
});

builder.Services.Configure<RequestLocalizationOptions>(options =>
{
    var invariantCulture = CultureInfo.InvariantCulture;

    var supportedCultures = new[] { invariantCulture };

    options.DefaultRequestCulture = new RequestCulture(invariantCulture);
    options.SupportedCultures = supportedCultures;
    options.SupportedUICultures = supportedCultures;
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
            options.JsonSerializerOptions.UnmappedMemberHandling = System.Text.Json.Serialization.JsonUnmappedMemberHandling.Skip;
        })
        .ConfigureApiBehaviorOptions(options =>
         {
             options.InvalidModelStateResponseFactory = context =>
             {
                 // Cria um objeto com os detalhes do erro
                 var problemDetails = new ValidationProblemDetails(context.ModelState)
                 {
                     Title = "Um ou mais erros de validação ocorreram.",
                     Status = StatusCodes.Status400BadRequest,
                     Instance = context.HttpContext.Request.Path
                 };

                 // Loga o erro detalhado no servidor para você ver no 'docker logs'
                 var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                 logger.LogError("Erro de Validação de Modelo: {@ValidationErrors}", problemDetails.Errors);

                 // Retorna o erro detalhado para o cliente (frontend)
                 return new BadRequestObjectResult(problemDetails);
             };
         });
/*builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/Auth/Login";  // Caminho para o redirecionamento de login
}); */

builder.Services.AddCors(options => {
    options.AddPolicy("AllowSpecificOrigin", builder => {
        builder
            .WithOrigins("https://fomedique.com.br", "https://sistema-de-gestao-v4.vercel.app", "http://localhost:5000")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials()
            .SetIsOriginAllowed(_ => true) // Para testes - remova em produ��o!
            .WithExposedHeaders("Content-Disposition"); // Se necess�rio
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

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.File("Logs/log-.txt",
                  rollingInterval: RollingInterval.Day,
                  fileSizeLimitBytes: 10_000_000,
                  rollOnFileSizeLimit: true,
                  retainedFileCountLimit: 5) 
    .CreateLogger();
builder.Host.UseSerilog();

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


using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DataBaseContext>();
    db.Database.Migrate(); // Isso roda as migrações pendentes
}

app.UseRequestLocalization();
//swagger
app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Minha API v1"));

app.UseDeveloperExceptionPage();
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseCors("AllowSpecificOrigin");
app.UseStaticFiles();
app.UseAuthentication(); // Adicione isso
app.UseAuthorization();  // E isso tamb�m
app.UseSession();
app.MapControllers();
//Order Hub
app.MapHub<OrderHub>("/orderHub");
app.MapHub<PagamentoPixHub>("/pagamentoPixHub");

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
