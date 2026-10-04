# Hosting on a Hostinger VPS

The site is one Node.js app with a PostgreSQL database. nginx sits in front of it and sends
both the main domain and the admin subdomain to the app; the app only shows the admin area on
the admin subdomain.

Replace `example.com` with your domain throughout. Commands are for Ubuntu 22.04/24.04, run
over SSH as a user with `sudo`.

## 1. Point the domains at the VPS

In Hostinger's DNS zone editor, add **A records** to the VPS IP address for:

- `example.com` (name `@`)
- `www.example.com`
- `admin.example.com`

## 2. Install Node.js, PostgreSQL and nginx

```sh
sudo apt update && sudo apt install -y nginx postgresql git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # must be 22.12 or newer
```

## 3. Create the database

```sh
sudo -u postgres psql -c "CREATE USER portfolio WITH PASSWORD 'choose-a-db-password';"
sudo -u postgres psql -c "CREATE DATABASE portfolio OWNER portfolio;"
```

## 4. Get the code and configure it

```sh
sudo mkdir -p /var/www/portfolio && sudo chown $USER /var/www/portfolio
git clone https://github.com/Abairaj/ashwin-personal-portifolio.git /var/www/portfolio
cd /var/www/portfolio
npm ci
cp .env.example .env
```

Create the admin password hash and a session secret:

```sh
npm run hash-password      # type the password you want; copy the printed line
openssl rand -hex 32       # copy the output
```

Edit `.env` (`nano .env`):

```ini
SITE_URL=https://example.com
ADMIN_HOST=admin.example.com
DATABASE_URL=postgres://portfolio:choose-a-db-password@localhost:5432/portfolio
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=scrypt:...        # the line from hash-password
SESSION_SECRET=...                    # the openssl output
UPLOAD_DIR=/var/www/portfolio/uploads
HOST=127.0.0.1
PORT=4321
```

Then:

```sh
chmod 600 .env
npm run build
npm run db:migrate     # creates the tables
npm run db:import      # optional: loads the five sample posts
```

## 5. Keep the app running (systemd)

`sudo nano /etc/systemd/system/portfolio.service`:

```ini
[Unit]
Description=Portfolio site
After=network.target postgresql.service

[Service]
WorkingDirectory=/var/www/portfolio
ExecStart=/usr/bin/node --env-file=.env dist/server/entry.mjs
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

```sh
sudo chown -R www-data /var/www/portfolio/uploads 2>/dev/null || sudo install -d -o www-data /var/www/portfolio/uploads
sudo chown www-data /var/www/portfolio/.env
sudo systemctl enable --now portfolio
sudo systemctl status portfolio      # should say "active (running)"
```

## 6. nginx

`sudo nano /etc/nginx/sites-available/portfolio`:

```nginx
server {
    listen 80;
    server_name example.com www.example.com admin.example.com;

    client_max_body_size 12m;   # image uploads

    location / {
        proxy_pass http://127.0.0.1:4321;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```sh
sudo ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 7. HTTPS

```sh
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com -d admin.example.com
```

Certbot edits the nginx file and renews the certificates by itself.

## 8. Firewall

```sh
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
```

PostgreSQL and the app listen only on the server itself, so nothing else needs opening.

## 9. Check it

- `https://example.com` shows the site; `https://example.com/admin/` shows "Not found".
- `https://admin.example.com` shows the sign-in page. Sign in, write a post, press Publish,
  and it appears on `https://example.com/writing/`.

## Updating the site later

```sh
cd /var/www/portfolio
git pull
npm ci
npm run build
npm run db:migrate
sudo systemctl restart portfolio
```

## Changing the admin password

Run `npm run hash-password`, replace `ADMIN_PASSWORD_HASH` in `.env`, then
`sudo systemctl restart portfolio`. Changing `SESSION_SECRET` signs everyone out.

## Backups

Two things hold your content: the database and the uploads folder.

```sh
pg_dump "postgres://portfolio:choose-a-db-password@localhost:5432/portfolio" > backup-$(date +%F).sql
tar czf uploads-$(date +%F).tar.gz -C /var/www/portfolio uploads
```

Copy both files off the server. Hostinger's VPS snapshots are a good second layer.

## If something goes wrong

| What you see | Where to look |
| --- | --- |
| 502 Bad Gateway | The app is not running: `sudo journalctl -u portfolio -n 50` |
| Site loads but no posts | Database connection: check `DATABASE_URL` in `.env`, then the journal as above |
| "The admin account is not set up yet" | `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` or `SESSION_SECRET` is empty in `.env` |
| "Forbidden" when signing in | nginx is not passing `Host`; check the `proxy_set_header Host $host;` line |
| Image upload fails for large files | `client_max_body_size` in the nginx file |
| "Too many attempts" | Five wrong passwords; wait 15 minutes or restart the service |
