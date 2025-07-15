#!/bin/bash

# Database Archival Runner for Fly.io
# Executes the database archival process in the production environment

echo "🚀 Running database archival on Fly.io..."

# Run the archival script on Fly.io where DATABASE_URL is available
fly ssh console -a dealbrief-scanner-workers -C "cd /app && node archive-database.js"

echo "✅ Archival process completed!"
echo ""
echo "📋 Next steps:"
echo "   1. Verify the archive completed successfully"
echo "   2. Test new scans work correctly"
echo "   3. Check archived data is accessible if needed"
echo ""
echo "🔍 To check archived data later:"
echo "   fly ssh console -a dealbrief-scanner-workers"
echo "   psql \$DATABASE_URL -c \"SELECT * FROM archived_scans LIMIT 5;\""