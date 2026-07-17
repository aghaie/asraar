#!/usr/bin/env bash
# پشتیبان‌گیریِ روزانه‌ی SQLiteِ مناد (سازگار با WAL — از .backup خودِ sqlite استفاده می‌کند).
# استفاده:  MONAD_DB_PATH=/srv/monad/data/monad.db BACKUP_DIR=/srv/backups ./scripts/backup.sh
# نمونه‌ی cron (هر شب ۳:۳۰):
#   30 3 * * * MONAD_DB_PATH=/srv/monad/data/monad.db BACKUP_DIR=/srv/backups /srv/monad/scripts/backup.sh >> /var/log/monad-backup.log 2>&1
set -euo pipefail

DB="${MONAD_DB_PATH:-./data/monad.db}"
DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"

[ -f "$DB" ] || { echo "پایگاه داده پیدا نشد: $DB" >&2; exit 1; }
mkdir -p "$DIR"

STAMP="$(date +%F-%H%M)"
OUT="$DIR/monad-$STAMP.db"

# .backup حتی وسطِ نوشتن هم snapshot سازگار می‌گیرد (برخلاف cp خام).
sqlite3 "$DB" ".backup '$OUT'"
gzip -f "$OUT"

# پاک‌سازیِ پشتیبان‌های کهنه
find "$DIR" -name 'monad-*.db.gz' -mtime "+$KEEP_DAYS" -delete

echo "backup ok: $OUT.gz ($(du -h "$OUT.gz" | cut -f1))"
