# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install ALL dependencies (including devDependencies like esbuild/vite)
RUN npm install

# Copy the rest of your application code
COPY . .

# Run the build script (compiles frontend via Vite AND backend via esbuild)
RUN npm run build

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Define the environment variable for the port
ENV PORT=8080

# Start the built full-stack Express server
CMD ["npm", "start"]
