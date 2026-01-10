#!/usr/bin/env bash
set -euo pipefail

# Simple smoke tests for deployed panels.
# Usage:
#   ./deploy/smoke_test.sh admin.yessgo.org partner.yessgo.org

ADMIN_HOST="${1:-admin.yessgo.org}"
PARTNER_HOST="${2:-partner.yessgo.org}"

echo "Testing admin API endpoints on $ADMIN_HOST..."
curl -fsS -o /dev/null -w "admin /api/partners: %{http_code}\n" "https://$ADMIN_HOST/api/partners"
curl -fsS -o /dev/null -w "admin / (index): %{http_code}\n" "https://$ADMIN_HOST/"

echo "Testing partner API endpoints on $PARTNER_HOST..."
curl -fsS -o /dev/null -w "partner /api/products: %{http_code}\n" "https://$PARTNER_HOST/api/products"
curl -fsS -o /dev/null -w "partner / (index): %{http_code}\n" "https://$PARTNER_HOST/"

echo "Smoke tests completed."


