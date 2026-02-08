#!/usr/bin/env sh
# 有設 DOMAIN / EMAIL 時：用 Let's Encrypt (certbot) 取得憑證
# 未設時：產生自簽憑證給本機用（瀏覽器需手動信任）
# 用法：DOMAIN=chat.example.com EMAIL=admin@example.com ./scripts/generate-ssl-cert.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="${SCRIPT_DIR}/../"
SSL_DIR="${ROOT_DIR}nginx/ssl"
WEBROOT_DIR="${ROOT_DIR}nginx/certbot-webroot"
VOLUME_NAME="certbot-etc"

DOMAIN="${DOMAIN:-}"
EMAIL="${EMAIL:-}"

mkdir -p "$SSL_DIR" "$WEBROOT_DIR"

if [ -n "$DOMAIN" ] && [ -n "$EMAIL" ]; then
  echo "向 Let's Encrypt 申請憑證（網域: $DOMAIN）..."
  docker run --rm \
    -v "${WEBROOT_DIR}:/var/www/certbot" \
    -v "${VOLUME_NAME}:/etc/letsencrypt" \
    certbot/certbot certonly \
    --webroot -w /var/www/certbot \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive

  echo "複製憑證到 nginx/ssl/ ..."
  docker run --rm \
    -v "${VOLUME_NAME}:/etc/letsencrypt:ro" \
    -v "${SSL_DIR}:/out" \
    alpine sh -c "cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /out/ && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /out/"

  echo "完成。憑證已放在 nginx/ssl/"
  echo "請重載 Nginx：docker compose exec nginx nginx -s reload"
else
  echo "未設 DOMAIN/EMAIL，產生自簽憑證（本機用）..."
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "${SSL_DIR}/privkey.pem" \
    -out "${SSL_DIR}/fullchain.pem" \
    -subj "/CN=localhost"
  echo "自簽憑證已產生於 nginx/ssl/"
  echo "可執行: docker compose up --build"
fi
