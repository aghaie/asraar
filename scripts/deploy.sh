#!/usr/bin/env bash
# استقرار/به‌روزرسانیِ مناد روی سرور (مسیر الفِ DEPLOYMENT.md — systemd + nginx).
# روی خودِ سرور اجرا می‌شود:  cd /srv/monad && ./scripts/deploy.sh
# نخستین بار: پس از clone و ساختِ .env (از .env.example) و سرویسِ systemd طبق docs/DEPLOYMENT.md.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "→ git pull"
git pull --ff-only

echo "→ npm ci"
npm ci --no-audit --no-fund

echo "→ تستِ سریع"
npm test

echo "→ بیلدِ تولیدی"
npm run build

echo "→ ری‌استارتِ سرویس"
sudo systemctl restart monad

sleep 2
echo "→ سلامت"
curl -sf -o /dev/null -w "GET / → %{http_code}\n" http://127.0.0.1:3000/ \
  && echo "استقرار سبز ✓" \
  || { echo "سرویس بالا نیامد! journalctl -u monad -n 50 را ببین" >&2; exit 1; }
