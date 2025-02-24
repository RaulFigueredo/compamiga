FROM node:20-alpine

WORKDIR /app

# Instalar dependencias primero para aprovechar el caché de Docker
COPY package*.json ./
RUN npm install

# Copiar el resto de la aplicación
COPY . .

# Variables de entorno
ENV NODE_ENV=production
ENV VITE_PORT=5173
ENV HOST=0.0.0.0

# Exponer el puerto de Vite
EXPOSE 5173

# Iniciar el servidor
CMD ["npm", "run", "dev", "--", "--host"]
