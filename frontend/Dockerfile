# Use official Node.js image
FROM node:18

# Set working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json ./

# Install dependencies
RUN npm install


# Copy the rest of the frontend code
COPY . .

# Expose the frontend port
EXPOSE 3000

# Start the frontend server
CMD ["npm", "start"]



# # Use official Node.js image
# FROM node:18

# # Set working directory in the container
# WORKDIR /app

# # Copy package.json and package-lock.json
# COPY package*.json ./

# # Install dependencies
# RUN npm install

# # Copy the rest of the frontend code
# COPY . .

# # Build the React app
# RUN npm run build

# # Use Nginx to serve the built frontend
# FROM nginx:alpine
# COPY --from=0 /app/build /usr/share/nginx/html

# # Expose port 80 (default for Nginx)
# EXPOSE 80

# # Start Nginx
# CMD ["nginx", "-g", "daemon off;"]
