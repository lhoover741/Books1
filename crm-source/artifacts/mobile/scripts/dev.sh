#!/bin/sh

PORT="${PORT:-8081}"

start_expo() {
  if [ -n "$REPLIT_DEV_DOMAIN" ]; then
    EXPO_PACKAGER_PROXY_URL="https://$REPLIT_EXPO_DEV_DOMAIN" \
    EXPO_PUBLIC_DOMAIN="$REPLIT_DEV_DOMAIN" \
    EXPO_PUBLIC_REPL_ID="$REPL_ID" \
    REACT_NATIVE_PACKAGER_HOSTNAME="$REPLIT_DEV_DOMAIN" \
    CI=1 pnpm exec expo start --localhost --port "$PORT" &
  else
    EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-http://127.0.0.1:${API_PORT:-4010}}" \
    CI=1 pnpm exec expo start --localhost --port "$PORT" &
  fi

  expo_pid=$!
  trap 'kill "$expo_pid" 2>/dev/null || true; wait "$expo_pid" 2>/dev/null || true; exit 0' INT TERM
  wait "$expo_pid"
}

start_expo
exit_code=$?

if [ "$exit_code" -eq 130 ] || [ "$exit_code" -eq 143 ]; then
  exit 0
fi

exit "$exit_code"
