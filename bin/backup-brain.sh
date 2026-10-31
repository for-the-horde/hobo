#!/usr/bin/env bash
# Saves a gzipped JSON copy of hobo's brain (the hubot:storage key) to ./backups,
# keeps the newest 30, and optionally copies it to S3.
#
# Run from the repo directory on the host, e.g. nightly from cron:
#   17 9 * * * cd /opt/hobo && bin/backup-brain.sh >> backups/backup.log 2>&1
# Optional: HOBO_BACKUP_S3_URI=s3://bucket/prefix (needs the aws CLI and an instance role).
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p backups
out="backups/hobo-brain-$(date -u +%Y%m%dT%H%M%SZ).json.gz"

docker compose exec -T redis redis-cli --raw GET hubot:storage | gzip > "$out.tmp"
# An empty or tiny backup means something is wrong; don't rotate good ones out.
if [ "$(gzip -dc "$out.tmp" | wc -c)" -lt 1000 ]; then
  echo "$(date -u +%FT%TZ) backup too small, keeping previous backups" >&2
  rm -f "$out.tmp"
  exit 1
fi
mv "$out.tmp" "$out"

ls -1t backups/hobo-brain-*.json.gz | tail -n +31 | xargs -r rm -f

if [ -n "${HOBO_BACKUP_S3_URI:-}" ]; then
  aws s3 cp --only-show-errors "$out" "${HOBO_BACKUP_S3_URI%/}/$(basename "$out")"
fi
echo "$(date -u +%FT%TZ) wrote $out"
