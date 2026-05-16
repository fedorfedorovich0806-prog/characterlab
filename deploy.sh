#!/bin/bash
set -e

echo "=== CharacterLab Deploy Script ==="

# 1. Обновляем систему
apt update && apt upgrade -y

# 2. Ставим Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git nginx

# 3. Ставим PM2
npm install -g pm2

# 4. Клонируем проект
cd /root
rm -rf characterlab
git clone https://github.com/fedorfedorovich0806-prog/characterlab.git
cd characterlab

# 5. Создаём .env
cat > .env << 'ENVFILE'
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="clab-prod-jwt-secret-x8k2m9v4n7q1w5z3"
LLM_API_KEY="sk-a0594b865923d535a74b00be79f32efa80a310ff8f2f02ba"
LLM_BASE_URL="https://ai.externcashpn.cv/v1"
LLM_MODEL="gpt-5.4-mini"
REDIS_URL=""
ENVFILE

# 6. Устанавливаем зависимости и собираем
npm install
npx prisma db push
npm run build

# 7. Создаём admin-аккаунт
node prisma/seed-admin.mjs

# 8. Настраиваем PM2
pm2 start npm --name "characterlab" -- start
pm2 save
pm2 startup systemd -u root --hp /root

# 9. Настраиваем Nginx
cat > /etc/nginx/sites-available/characterlab << 'NGINX'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
        proxy_buffering off;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/characterlab /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# 10. Открываем порты
ufw allow 80
ufw allow 443
ufw allow 22
echo "y" | ufw enable

echo ""
echo "=== ГОТОВО! ==="
echo "Сайт доступен: http://77.222.38.169"
echo "Admin: username=admin, password=admin123"
echo ""
