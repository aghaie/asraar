# استقرار مناد روی آروان‌کلاد (دامنه: asraar.ir)

دو مسیر پشتیبانی می‌شود. برای MVP، **مسیر الف (سرور ابری)** ساده‌تر و به دلیل دیسک پایدار برای SQLite مطمئن‌تر است.

> **نکته‌ی حیاتی — دسترسی به API:** سرورهای داخل ایران ممکن است به `api.anthropic.com` دسترسی مستقیم نداشته باشند. در این صورت یک relay/gateway کوچک روی سروری خارج مستقر کنید و آدرس آن را در `ANTHROPIC_BASE_URL` بگذارید. بدون کلید/دسترسی، سایت با موتور آزمایشی بالا می‌آید (برای تست، نه تولید).

---

## مسیر الف — سرور ابری آروان (IaaS)

یک سرور ابری Ubuntu 22.04/24.04 بسازید (برای شروع: 2 vCPU / 2GB RAM کافی است).

### ۱) آماده‌سازی

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
```

### ۲) برنامه

```bash
sudo mkdir -p /srv/monad && sudo chown $USER /srv/monad
git clone https://github.com/aghaie/asraar.git /srv/monad
cd /srv/monad
npm ci
cp .env.example .env
# در .env:
#   ANTHROPIC_API_KEY=sk-ant-…
#   ANTHROPIC_BASE_URL=…            ← اگر relay دارید
#   MONAD_SALT=$(openssl rand -hex 32)
#   MONAD_DB_PATH=/srv/monad/data/monad.db
npm run build
```

### ۳) سرویس systemd — `/etc/systemd/system/monad.service`

```ini
[Unit]
Description=MONAD — dialogue with truth
After=network.target

[Service]
WorkingDirectory=/srv/monad
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=3
Environment=NODE_ENV=production
Environment=PORT=3000
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo mkdir -p /srv/monad/data && sudo chown -R www-data:www-data /srv/monad/data
sudo systemctl enable --now monad
```

### ۴) Nginx و TLS

`/etc/nginx/sites-available/asraar.ir`:

```nginx
server {
    server_name asraar.ir www.asraar.ir;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> `X-Forwarded-For` حیاتی است: سهمیه‌ی روزانه و یکتایی رأی‌ها بر اساس آن است.

```bash
sudo ln -s /etc/nginx/sites-available/asraar.ir /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d asraar.ir -d www.asraar.ir
```

### ۵) DNS و CDN آروان
در پنل آروان، دامنه‌ی `asraar.ir` را به CDN اضافه کنید و رکورد A را به IP سرور بدهید. اگر CDN را «ابر فعال» می‌کنید، در تنظیمات HTTPS حالت full را بگذارید و مطمئن شوید هدر `X-Forwarded-For`/`X-Real-IP` واقعی کاربر عبور می‌کند.

### ۶) به‌روزرسانی و پشتیبان‌گیری

```bash
cd /srv/monad && git pull && npm ci && npm run build && sudo systemctl restart monad
# پشتیبان روزانه (cron):
sqlite3 /srv/monad/data/monad.db ".backup /srv/backups/monad-$(date +\%F).db"
```

---

## مسیر ب — پلتفرم کانتینر آروان (PaaS)

پروژه `Dockerfile` آماده دارد (خروجی standalone، کاربر non-root، حجم `/data` برای SQLite).

```bash
docker build -t monad:latest .
# تست محلی:
docker run -p 3000:3000 -v monad-data:/data -e ANTHROPIC_API_KEY=… monad:latest
```

سپس image را به رجیستری آروان push کنید و در پنل، اپلیکیشن کانتینری بسازید:
- پورت: `3000`
- **دیسک/Volume پایدار روی `/data`** (بدون آن، با هر ری‌استارت داده از بین می‌رود)
- متغیرهای محیطی: `ANTHROPIC_API_KEY`, `MONAD_SALT`, و در صورت نیاز `ANTHROPIC_BASE_URL`
- فقط **یک replica** (SQLite تک‌نویسنده است — ADR-0003). مقیاس افقی پس از مهاجرت به Postgres/Redis.

دامنه‌ی asraar.ir را در همان پنل به اپلیکیشن متصل و TLS را فعال کنید.

---

## پایش
- لاگ ساخت‌یافته JSON: `journalctl -u monad -f` یا لاگ کانتینر در پنل آروان
- migrationها هنگام بوت خودکار اجرا می‌شوند
- سلامت: `GET /` باید 200 بدهد
