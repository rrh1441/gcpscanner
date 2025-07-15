# Test Scan Commands

## Trigger a scan on vulnerable-test-site.vercel.app

```bash
curl -X POST https://dealbrief-scanner.fly.dev/scan \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "vulnerable-test-site.vercel.app",
    "companyName": "Test Company"
  }'
```

## Check scan status (replace SCAN_ID with actual ID from response)

```bash
curl https://dealbrief-scanner.fly.dev/scan/SCAN_ID/status
```

## Monitor scan until completion

```bash
SCAN_ID="YOUR_SCAN_ID_HERE"
while true; do
  STATUS=$(curl -s https://dealbrief-scanner.fly.dev/scan/$SCAN_ID/status | jq -r .state)
  echo "[$(date)] Status: $STATUS"
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    break
  fi
  sleep 5
done
```

## Check findings with remediation

```bash
curl https://dealbrief-scanner.fly.dev/api/scans/SCAN_ID/findings | jq '.[] | select(.remediation != null)'
```

## One-liner to trigger and get scan ID

```bash
SCAN_ID=$(curl -s -X POST https://dealbrief-scanner.fly.dev/scan \
  -H "Content-Type: application/json" \
  -d '{"domain": "vulnerable-test-site.vercel.app", "companyName": "Test"}' \
  | jq -r .scanId) && echo "Scan ID: $SCAN_ID"
```