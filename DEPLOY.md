# Hosting on a Hostinger VPS

The site is one Node.js app with a PostgreSQL database. nginx sits in front and sends both the
main domain and the admin subdomain to the app; the app shows the admin area only on the admin
subdomain.

## Where everything lives on the server

Your content is kept **outside** the code folder, so updating, re-cloning or even deleting the
code never touches it.

| What | Where | In the git repo? |
| --- | --- | --- |
| Code | `/var/www/portfolio` | Yes — replaceable at any time |
| Blog posts (database) | PostgreSQL's own data folder, `/var/lib/postgresql/` | No |
| Uploaded images | `/var/lib/portfolio/uploads` | No |
| Settings and passwords | `/etc/portfolio/.env` | No |
| Backups | `/var/backups/portfolio` | No |

In this guide replace `example.com` with your domain and `YOUR_SERVER_IP` with the VPS address.
Commands are for **Ubuntu 22.04 or 24.04**.

---

## 1. Prepare the VPS in Hostinger

1. In hPanel open **VPS → your server**. If it has no operating system yet, choose
   **Ubuntu 24.04** (plain, no control panel).
2. Note the **IP address** and the **root password** (or add your SSH key) under *SSH access*.
3. If hPanel shows a **Firewall** section with rules enabled, allow ports **22, 80 and 443**.

Connect from your computer:

```sh
ssh root@YOUR_SERVER_IP
```

## 2. Point the domains at the VPS

In hPanel open **Domains → your domain → DNS / Nameservers** and add three **A** records that
point to `YOUR_SERVER_IP`:

| Type | Name | Points to |
| --- | --- | --- |
| A | `@` | YOUR_SERVER_IP |
| A | `www` | YOUR_SERVER_IP |
| A | `admin` | YOUR_SERVER_IP |

DNS can take up to an hour. Check with `ping admin.example.com` before step 9.

## 3. Install the software

```sh
apt update && apt upgrade -y
apt install -y nginx postgresql git curl
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node -v      # must print v22.12 or newer
```

## 4. Create the PostgreSQL database

Generate a database password made only of letters and digits (it goes into a URL later):

```sh
openssl rand -hex 16
```

Copy the output; below it is called `DB_PASSWORD`.

```sh
sudo -u postgres psql -c "CREATE USER portfolio WITH PASSWORD 'DB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE portfolio OWNER portfolio;"
```

Check that the app will be able to connect:

```sh
psql "postgres://portfolio:DB_PASSWORD@localhost:5432/portfolio" -c "select 1;"
```

It should print a small table containing `1`. PostgreSQL starts by itself after a reboot and
keeps its data in `/var/lib/postgresql/`, which is not part of the code.

## 5. Create the permanent folders

A dedicated user runs the app; it owns the image folder and nothing else.

```sh
adduser --system --group --no-create-home portfolio

mkdir -p /var/lib/portfolio/uploads      # uploaded images
mkdir -p /etc/portfolio                  # settings
mkdir -p /var/backups/portfolio          # backups
chown portfolio:portfolio /var/lib/portfolio/uploads
```

## 6. Get the code

```sh
mkdir -p /var/www
git clone https://github.com/Abairaj/ashwin-personal-portifolio.git /var/www/portfolio
cd /var/www/portfolio
npm ci --omit=dev
```

## 7. Settings (`.env`)

Create the admin password hash and the session secret:

```sh
cd /var/www/portfolio
npm run hash-password      # type the admin password you want (10+ characters); copy the printed line
openssl rand -hex 32       # copy the output: this is SESSION_SECRET
```

Create the settings file **outside the code folder**:

```sh
nano /etc/portfolio/.env
```

Paste this and fill in the four marked values:

```ini
SITE_URL=https://example.com
ADMIN_HOST=admin.example.com
DATABASE_URL=postgres://portfolio:DB_PASSWORD@localhost:5432/portfolio
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=scrypt:PASTE_THE_LINE_FROM_hash-password
SESSION_SECRET=PASTE_THE_openssl_OUTPUT
UPLOAD_DIR=/var/lib/portfolio/uploads
HOST=127.0.0.1
PORT=4321
```

Save (Ctrl+O, Enter, Ctrl+X), then lock it down and link it into the code folder:

```sh
chown root:portfolio /etc/portfolio/.env
chmod 640 /etc/portfolio/.env
ln -s /etc/portfolio/.env /var/www/portfolio/.env
```

The link means the app finds its settings, while the real file stays safe in `/etc/portfolio`.

## 8. Build, create the tables, and start the app

```sh
cd /var/www/portfolio
npm run build
npm run db:migrate         # prints "Database is up to date."
```

Create the service that keeps the app running and restarts it after a crash or reboot:

```sh
nano /etc/systemd/system/portfolio.service
```

```ini
[Unit]
Description=Portfolio site
After=network.target postgresql.service
Wants=postgresql.service

[Service]
User=portfolio
Group=portfolio
WorkingDirectory=/var/www/portfolio
ExecStart=/usr/bin/node --env-file=/etc/portfolio/.env dist/server/entry.mjs
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```sh
systemctl daemon-reload
systemctl enable --now portfolio
systemctl status portfolio --no-pager     # should say "active (running)"
curl -I http://127.0.0.1:4321/            # should print "HTTP/1.1 200 OK"
```

## 9. nginx and HTTPS

```sh
nano /etc/nginx/sites-available/portfolio
```

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
ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

Add free HTTPS certificates (they renew by themselves):

```sh
apt install -y certbot python3-certbot-nginx
certbot --nginx -d example.com -d www.example.com -d admin.example.com
```

Turn on the server firewall:

```sh
ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw --force enable
```

The database and the app listen only inside the server, so no other port needs opening.

## 10. Check it

- `https://example.com` shows the site.
- `https://example.com/admin/` shows "Not found" (the admin is not reachable on the main domain).
- `https://admin.example.com` shows the sign-in page. Sign in, write a post with an image, press
  **Publish**, and it appears on `https://example.com/writing/`.
- `ls /var/lib/portfolio/uploads` lists the image you uploaded.
- `reboot`, wait a minute, and the site and the post are still there.

---

## Automatic backups

Posts are in the database and images are in the uploads folder; back up both every night.

```sh
nano /usr/local/bin/portfolio-backup
```

```sh
#!/bin/sh
set -e
day=$(date +%F)
dir=/var/backups/portfolio
sudo -u postgres pg_dump portfolio | gzip > "$dir/db-$day.sql.gz"
tar czf "$dir/uploads-$day.tar.gz" -C /var/lib/portfolio uploads
find "$dir" -type f -mtime +14 -delete     # keep two weeks
```

```sh
chmod +x /usr/local/bin/portfolio-backup
/usr/local/bin/portfolio-backup && ls -lh /var/backups/portfolio     # test it once
echo "30 2 * * * root /usr/local/bin/portfolio-backup" > /etc/cron.d/portfolio-backup
```

Backups on the same server do not survive losing the server. Also switch on Hostinger's
**VPS snapshots/backups** in hPanel, or copy `/var/backups/portfolio` to your computer now and
then: `scp -r root@YOUR_SERVER_IP:/var/backups/portfolio ./`

### Restoring

```sh
gunzip -c /var/backups/portfolio/db-2026-10-04.sql.gz | sudo -u postgres psql portfolio
tar xzf /var/backups/portfolio/uploads-2026-10-04.tar.gz -C /var/lib/portfolio
```

(Restore the database into an empty `portfolio` database: drop and re-create it as in step 4 first.)

## Updating the site after code changes

```sh
cd /var/www/portfolio
git pull
npm ci --omit=dev
npm run build
npm run db:migrate
systemctl restart portfolio
```

None of this touches the database, the images or the settings.

## Changing the admin password

```sh
cd /var/www/portfolio && npm run hash-password
nano /etc/portfolio/.env          # replace the ADMIN_PASSWORD_HASH line
systemctl restart portfolio
```

Changing `SESSION_SECRET` signs the admin out everywhere.

## If something goes wrong

| What you see | What to do |
| --- | --- |
| 502 Bad Gateway | The app is not running. `journalctl -u portfolio -n 50 --no-pager` shows why. |
| Site loads but shows no posts | The app cannot reach the database. Check `DATABASE_URL` in `/etc/portfolio/.env`, re-run the `psql ... -c "select 1;"` test from step 4, then read the journal. |
| "The admin account is not set up yet" | `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` or `SESSION_SECRET` is empty in `/etc/portfolio/.env`. |
| "Forbidden" when signing in | nginx is not passing the host name: check `proxy_set_header Host $host;`. |
| "Too many attempts" | Five wrong passwords. Wait 15 minutes, or `systemctl restart portfolio`. |
| Image upload fails | `ls -ld /var/lib/portfolio/uploads` must show owner `portfolio`. For large files check `client_max_body_size`. |
| Admin subdomain shows the nginx welcome page | DNS for `admin` is missing, or the name is missing from `server_name`. |
