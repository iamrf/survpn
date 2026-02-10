# Deployment Guide 🚀

Follow this guide to deploy the Persian Mini App to a production Linux server (e.g., Ubuntu).

## 📋 Prerequisites
- A Linux server with a public IP.
- Domain name (optional but recommended).
- Installed tools: `git`, `node` (LTS), `npm`, `pm2`, `nginx`.

## 1. Prepare the Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (via NVM recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install --lts

# Install PM2 globally
npm install -g pm2
```

## 2. Clone and Setup

```bash
git clone <your-repository-url>
cd persian-miniapp

# Install Backend
cd backend
npm install
cp .env.example .env # Create your production .env
cd ..

# Install Frontend
npm install
cp .env.example .env # Create your production .env
```

## 3. Build the Frontend

Ensure your root `.env` has the correct `VITE_API_URL` pointing to your production domain or IP.

```bash
npm run build
```
This will generate a `dist/` folder.

## 4. Run the Backend with PM2

Choose admin User:

sqlite3 backend/database.sqlite "UPDATE users SET is_admin = 1 WHERE id = YOUR_USER_ID;"

```bash
cd backend
pm2 start server.js --name "mini-app-api"
pm2 save
pm2 startup
```

## 5. Configure Nginx (Reverse Proxy)

Create a new Nginx configuration file:
`sudo nano /etc/nginx/sites-available/mini-app`

Past the following configuration (replace `your-domain.com` or `your-ip`):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend Static Files
    location / {
        root /path/to/persian-miniapp/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Optional: Health Check
    location /health {
        proxy_pass http://localhost:5000/health;
    }
}
```

Enable the site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/mini-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 6. Secure with SSL (Certbot)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

## 7. Database Backups
Since we are using SQLite, backing up your data is as simple as copying the `backend/database.sqlite` file. It is recommended to set up a cron job for this.

```bash
# Example cron job for daily backup
0 0 * * * cp /path/to/backend/database.sqlite /path/to/backups/db_$(date +\%F).sqlite
```

---
**Note**: Ensure your firewall (UFW) allows traffic on ports 80, 443, and any other required ports.
