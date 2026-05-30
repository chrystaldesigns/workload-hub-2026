# Upgrade to Node 22 to satisfy modern Tailwind v4 and Google GenAI SDK requirements
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies cleanly
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
