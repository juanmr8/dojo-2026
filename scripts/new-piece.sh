#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/new-piece.sh 01-paragraph-reveal
# Spins up one independent Next.js app under apps/<slug> (App Router, TS,
# Tailwind v4, Motion + GSAP, Prettier), no nested git repo, empty page.

if [ $# -lt 1 ]; then
  echo "Usage: $0 <NN-slug>   e.g. $0 01-paragraph-reveal"
  exit 1
fi

SLUG="$1"
if ! [[ "$SLUG" =~ ^[0-9]{2}-[a-z0-9-]+$ ]]; then
  echo "Error: slug must look like 01-paragraph-reveal (two digits, dash, kebab-case)."
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APPS_DIR="${ROOT_DIR}/apps"
TARGET_DIR="${APPS_DIR}/${SLUG}"

if [ -d "$TARGET_DIR" ]; then
  echo "Error: apps/${SLUG} already exists."
  exit 1
fi

cd "$APPS_DIR"

pnpm dlx create-next-app@latest "${SLUG}" \
  --ts \
  --tailwind \
  --eslint \
  --app \
  --use-pnpm \
  --no-src-dir \
  --disable-git \
  --import-alias "@/*"

cd "${TARGET_DIR}"

pnpm up --latest next react react-dom
pnpm add motion gsap
pnpm add -D \
  tailwindcss \
  @tailwindcss/postcss \
  typescript \
  @types/node \
  @types/react \
  @types/react-dom \
  prettier \
  prettier-plugin-tailwindcss

pnpm pkg set scripts.dev="next dev --turbopack"
pnpm pkg set scripts.build="next build --turbopack"
pnpm pkg set scripts.start="next start"

if [ ! -f "postcss.config.mjs" ] && [ ! -f "postcss.config.js" ]; then
  cat > postcss.config.mjs <<'EOT'
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
EOT
fi

cp "${ROOT_DIR}/.prettierrc.json" .prettierrc.json
cp "${ROOT_DIR}/.gitignore" .prettierignore

if [ -f "next.config.ts" ]; then
  cat > next.config.ts <<'EOT'
import type { NextConfig } from 'next';

const config: NextConfig = {
  turbopack: {
    root: __dirname,
  },
};

export default config;
EOT
fi

cat > app/page.tsx <<'EOT'
export default function Page() {
  return null;
}
EOT

mkdir -p docs
ln -s ../../../docs/agents/coding-standards.md docs/coding-standards.md

cat > README.md <<EOT
# ${SLUG}

What this piece explores: (one line)

\`\`\`
pnpm dev
\`\`\`
EOT

echo
echo "✅ apps/${SLUG} ready"
echo "   cd apps/${SLUG} && pnpm dev"
