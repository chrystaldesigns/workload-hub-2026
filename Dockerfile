# Use a lightweight web server to serve static files
FROM nginx:alpine

# Copy all your repository files into the web server directory
COPY . /usr/share/nginx/html

# Expose port 8080 for Google Cloud
EXPOSE 8080

# Configure Nginx to listen on port 8080 instead of the default 80
RUN sed -i 's/listen       80;/listen       8080;/g' /etc/nginx/conf.d/default.conf
