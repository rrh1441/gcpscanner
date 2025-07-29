# Test Commands for Scanner Worker

## Single Domain Test

```bash
gcloud pubsub topics publish scan-jobs --message='{"scanId":"test-vuln-001","domain":"vulnerable-test-site.vercel.app","companyName":"Vulnerable Test Corp"}' --project=precise-victory-467219-s4
```

## Alternative Test Domains

```bash
gcloud pubsub topics publish scan-jobs --message='{"scanId":"test-lodging-002","domain":"lodging-source.com","companyName":"Lodging Source Inc"}' --project=precise-victory-467219-s4
```

```bash
gcloud pubsub topics publish scan-jobs --message='{"scanId":"test-asi-003","domain":"asiweb.com","companyName":"ASI Web Solutions"}' --project=precise-victory-467219-s4
```

## Monitor Logs

```bash
gcloud run services logs read scanner-worker --region=us-west1 --project=precise-victory-467219-s4 --limit=20
```

## Follow Live Logs

```bash
gcloud run services logs tail scanner-worker --region=us-west1 --project=precise-victory-467219-s4
```