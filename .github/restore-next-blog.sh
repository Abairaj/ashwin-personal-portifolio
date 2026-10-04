#!/usr/bin/env bash
# Puts a fresh post template back at src/content/blog/next-blog.md after a
# writer has renamed it to publish a post. Does nothing if the file exists.
set -euo pipefail

template=".github/blog-template.md"
target="src/content/blog/next-blog.md"

if [ -f "$target" ]; then
  echo "next-blog.md already exists"
  exit 0
fi

today=$(TZ=Asia/Kolkata date +%F)
sed "s/^date: .*/date: $today/" "$template" > "$target"
echo "Created $target dated $today"
