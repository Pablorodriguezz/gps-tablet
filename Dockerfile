# Usa la imagen oficial de Node.js (versión 20 ligera)
FROM node:20-slim

# Crea y establece el directorio de la aplicación
WORKDIR /usr/src/app

# Copia los archivos de dependencia e instala (sin las dependencias de desarrollo)
COPY package*.json ./
RUN npm install --omit=dev

# Copia el código fuente (incluido server.js)
COPY . .

# Cloud Run inyectará la variable PORT, pero si la define en 8080 funciona
EXPOSE 8080 

# Comando para iniciar la aplicación
CMD [ "node", "server.js" ]