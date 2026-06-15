# Переходим в папку docker
cd docker

# Собираем образ
docker build -t crm-nginx .

# Запускаем контейнер:
# - Примонтируем папку с сертификатами в /etc/nginx/ssl/
# - Примонтируем исходники (чтобы не пересобирать образ при каждом изменении кода)
# - Пробрасываем порт 8443
docker run -d \
  --name ophthalmic-crm \
  -v /etc/letsencrypt/live/lllang.site/fullchain.pem:/etc/nginx/ssl/fullchain.pem:ro \
  -v /etc/letsencrypt/live/lllang.site/privkey.pem:/etc/nginx/ssl/privkey.pem:ro \
  -v $(pwd)/../src:/usr/share/nginx/html:ro \
  -p 8443:8443 \
  crm-nginx