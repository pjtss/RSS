#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${STOCKMAN_BASE_URL:-http://127.0.0.1:3000}"
CRON_SECRET="${CRON_SECRET:?CRON_SECRET is required}"

curl --fail-with-body --silent --show-error --max-time 50 \
  -H "x-cron-secret: ${CRON_SECRET}" \
  -X POST "${BASE_URL}/api/cron/sync-filings"

curl --fail-with-body --silent --show-error --max-time 50 \
  -H "x-cron-secret: ${CRON_SECRET}" \
  -X POST "${BASE_URL}/api/cron/us-turnover-ratio"

curl --fail-with-body --silent --show-error --max-time 50 \
  -H "x-cron-secret: ${CRON_SECRET}" \
  -X POST "${BASE_URL}/api/cron/check-bullish"
