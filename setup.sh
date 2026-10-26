#!/usr/bin/env bash
set -Eeuo pipefail

required_node_major=20
node_major="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$node_major" -lt "$required_node_major" ]; then
  echo "Node.js >= 20 is required; found $(node --version)." >&2
  exit 1
fi

required_npm_version=10.2.3
npm_version="$(npm --version)"
if [ "$(printf '%s\n' "$required_npm_version" "$npm_version" | sort -V | head -n1)" != "$required_npm_version" ]; then
  echo "npm >= $required_npm_version is required; found $npm_version." >&2
  exit 1
fi

npm ci --no-audit --no-fund
npm run build
npm test
echo "PixelPlanet setup completed successfully."
