# Use an official Node runtime as the base image
FROM node:18-alpine

# Set working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 19006

# Command to run the application
<<<<<<< HEAD
CMD ["npm", "start", "--web", "--port", "19006"]
=======
CMD ["npm", "start", "--", "--web", "--port", "19006"]
>>>>>>> restored-version
