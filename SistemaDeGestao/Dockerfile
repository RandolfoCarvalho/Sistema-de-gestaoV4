# Etapa de build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copiar todos os arquivos, incluindo o appsettings
COPY . . 
COPY appsettings.json /app/appsettings.json

# Tentar restore com --no-cache
RUN dotnet restore --no-cache

# Publicação do projeto
RUN dotnet publish -c Release -r linux-x64 --self-contained false -o ./publish

# Etapa de runtime com SDK para permitir execução de migrações
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Copiar a publicação do estágio build
COPY --from=build /app/publish . 

# Configuração do entrypoint
ENTRYPOINT ["dotnet", "SistemaDeGestao.dll"]
