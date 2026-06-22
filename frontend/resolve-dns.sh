#!/bin/sh
# Find nameservers in /etc/resolv.conf
RESOLVERS=$(grep -i '^nameserver' /etc/resolv.conf | awk '{print $2}')

FORMATTED_RESOLVERS=""
for r in $RESOLVERS; do
  if echo "$r" | grep -q ':'; then
    # IPv6 address, wrap in brackets if not already wrapped
    case "$r" in
      \[*\]) FORMATTED_RESOLVERS="$FORMATTED_RESOLVERS $r" ;;
      *) FORMATTED_RESOLVERS="$FORMATTED_RESOLVERS [$r]" ;;
    esac
  else
    FORMATTED_RESOLVERS="$FORMATTED_RESOLVERS $r"
  fi
done

# Clean up spaces
FORMATTED_RESOLVERS=$(echo "$FORMATTED_RESOLVERS" | xargs)

if [ -z "$FORMATTED_RESOLVERS" ]; then
  FORMATTED_RESOLVERS="127.0.0.11"
fi

echo "🔍 Configured DNS resolvers in Nginx: $FORMATTED_RESOLVERS"
sed -i "s/RESOLVER_IP/$FORMATTED_RESOLVERS/g" /etc/nginx/conf.d/default.conf
