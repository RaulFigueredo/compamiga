# Usa una imagen base de Node.js
FROM node:16

# Establece el directorio de trabajo
WORKDIR /app

# Instala herramientas de depuración
RUN apt-get update && apt-get install -y \
    net-tools \
    iputils-ping \
    && rm -rf /var/lib/apt/lists/*

# Copia los archivos de package.json y package-lock.json
COPY package*.json ./

# Instala Expo CLI globalmente
RUN npm install -g expo-cli

# Instala las dependencias con npm ci para instalaciones más predecibles
RUN npm ci

# Copia el resto de los archivos del proyecto
COPY . .

# Expone el puerto para el desarrollo web
EXPOSE 19006

# Comando para iniciar la aplicación con más verbosidad
CMD ["npm", "run", "web"]
