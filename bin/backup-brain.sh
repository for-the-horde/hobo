#!/usr/bin/env bash
# Saves a gzipped JSON copy of hobo's brain (the hubot:storage key) to ./backups,
# keeps the newest 30, and optionally uploads it to S3. Logs to backups/backup.log.
#
# Run from cron on the host, e.g. nightly:
#   17 9 * * * /opt/hobo/bin/backup-brain.sh
# Optional: HOBO_BACKUP_S3_URI=s3://bucket/path/hobo-brain.json.gz
#   Every run overwrites that one object; use a versioned bucket to keep history.
#   Needs the aws CLI and permission to s3:PutObject on that key.
set -euo pipefail
# cron's PATH is minimal; the aws CLI may live in /usr/local/bin or /snap/bin.
export PATH="${PATH:-/usr/bin:/bin}:/usr/local/bin:/snap/bin"

cd "$(dirname "$0")/.."
mkdir -p backups
exec >> backups/backup.log 2>&1

out="backups/hobo-brain-$(date -u +%Y%m%dT%H%M%SZ).json.gz"
trap 'rm -f "$out.tmp"' EXIT

docker compose exec -T redis redis-cli --raw GET hubot:storage | gzip > "$out.tmp"
# An empty or tiny backup means something is wrong; don't rotate good ones out.
if [ "$(gzip -dc "$out.tmp" | wc -c)" -lt 1000 ]; then
  echo "$(date -u +%FT%TZ) backup too small, keeping previous backups"
  exit 1
fi
mv "$out.tmp" "$out"

ls -1t backups/hobo-brain-*.json.gz | tail -n +31 | xargs -r rm -f

if [ -n "${HOBO_BACKUP_S3_URI:-}" ]; then
  aws s3 cp --only-show-errors "$out" "$HOBO_BACKUP_S3_URI"
  echo "$(date -u +%FT%TZ) uploaded to $HOBO_BACKUP_S3_URI"
fi
echo "$(date -u +%FT%TZ) wrote $out"
