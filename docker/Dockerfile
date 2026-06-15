FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf

COPY ../src /usr/share/nginx/html

EXPOSE 8443

CMD ["nginx", "-g", "daemon off;"]