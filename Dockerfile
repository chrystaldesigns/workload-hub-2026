FROM nginx:alpine

# Copy everything from the workspace into Nginx
COPY . /usr/share/nginx/html/

# If Google Cloud put the files in a subfolder, this moves them to the right spot
RUN if [ -d "/usr/share/nginx/html/workload" ]; then cp -r /usr/share/nginx/html/workload/* /usr/share/nginx/html/; fi

EXPOSE 8080

RUN sed -i 's/listen       80;/listen       8080;/g' /etc/nginx/conf.d/default.conf
