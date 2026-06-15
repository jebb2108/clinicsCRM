# Собираем образ
docker build -f docker/Dockerfile -t crm-nginx .

# Удаляем пред контейнер
docker rm -f ophthalmic-crm

# Запускаем контейнер:
docker run -d  --name ophthalmic-crm  \
  -v /etc/letsencrypt/live/lllang.site/fullchain.pem:/etc/nginx/ssl/fullchain.pem:ro   \
  -v /etc/letsencrypt/live/lllang.site/privkey.pem:/etc/nginx/ssl/privkey.pem:ro  \
  -v $(pwd)/src:/usr/share/nginx/html:ro   -p 8443:8443   crm-nginx