#!/bin/bash

echo "Setting up Fly API token for queue monitoring..."

# Generate the API token
echo "1. Generating Fly API token..."
FLY_TOKEN=$(fly tokens create machines --json | jq -r '.token')

if [ -z "$FLY_TOKEN" ]; then
    echo "Error: Failed to generate Fly API token"
    exit 1
fi

echo "2. Setting API token as app secret..."
fly secrets set FLY_API_TOKEN="$FLY_TOKEN"

if [ $? -eq 0 ]; then
    echo "✅ API token set successfully!"
    echo "   Token starts with: ${FLY_TOKEN:0:20}..."
    echo "   The queue monitor will now be able to auto-scale workers"
else
    echo "❌ Failed to set API token as secret"
    exit 1
fi

echo "3. Ready to deploy with working auto-scaling!"