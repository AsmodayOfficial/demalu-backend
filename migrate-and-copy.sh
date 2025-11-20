#!/bin/bash

# Config
CONTAINER_NAME=backend-1
CONTAINER_MIGRATIONS_PATH=/app/prisma/migrations
HOST_MIGRATIONS_PATH=./prisma/migrations

# Step 1: Run migration inside container
if [ -z "$1" ]; then
  echo "❌ Migration name is required as first argument"
  echo "Usage: ./migrate-and-copy.sh add-new-field"
  exit 1
fi

MIGRATION_NAME=$1

echo "Running migration in $CONTAINER_NAME..."
docker exec -it "$CONTAINER_NAME" npx prisma migrate dev --name "$MIGRATION_NAME"

# Step 2: Copy back migrations
echo "Copying migrations from container to host..."
docker cp "$CONTAINER_NAME:$CONTAINER_MIGRATIONS_PATH" "$HOST_MIGRATIONS_PATH"

# Step 3: Optional git add
if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo "Adding migrations to git..."
  git add "$HOST_MIGRATIONS_PATH"
  echo "✅ Migration '$MIGRATION_NAME' completed and added to Git (not committed)."
else
  echo "⚠️ Not inside a Git repository, skipping Git add."
fi
