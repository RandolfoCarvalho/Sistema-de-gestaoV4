# Usa a imagem base oficial do Node.js
FROM node:14

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia os arquivos package.json e package-lock.json para o diretório de trabalho
COPY package*.json ./

# Instala as dependências do projeto definidas no package.json
RUN npm install

# Copia todos os arquivos e diretórios do contexto de build atual para o diretório de trabalho no contêiner
COPY . .

# Expõe a porta 3000 para que a aplicação possa ser acessada
EXPOSE 3000

# Define o comando padrão a ser executado quando o contêiner inicia
CMD ["node", "app.js"]