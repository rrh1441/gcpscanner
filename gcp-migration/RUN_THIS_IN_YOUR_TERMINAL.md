# 🚨 CRITICAL: Run These Commands in Your Authenticated Terminal

Due to authentication session isolation, you need to run the deployment directly in your terminal where you're authenticated.

## 📋 **Step-by-Step Deployment Commands**

Copy and paste these commands **one by one** in your authenticated terminal:

### 1. Navigate to the project
```bash
cd /Users/ryanheger/dealbrief-scanner/gcp-migration
```

### 2. Verify authentication
```bash
gcloud config set account ryan@simplcyber.io
gcloud config set project precise-victory-467219-s4
gcloud auth list
```

### 3. Run infrastructure setup
```bash
cd deploy
./setup-pubsub.sh
```

### 4. Deploy scanner worker
```bash
./deploy-worker.sh
```

### 5. Deploy report generator
```bash
./deploy-reports.sh
```

### 6. Test the pipeline
```bash
cd ../test
./test-workflow.sh complete
```

## 🔍 **Or Run Everything at Once**
```bash
cd /Users/ryanheger/dealbrief-scanner/gcp-migration
./deploy-all.sh
```

## 📤 **Report Back to Claude**

After running each command, **copy and paste any errors or output** so I can:
- Track and resolve deployment issues
- Update the documentation  
- Fix any problems in the scripts
- Ensure the complete pipeline works

## 🎯 **What to Watch For**

Common issues I expect and will help resolve:
1. **Missing APIs** - I'll help enable them
2. **Permission errors** - I'll help fix IAM issues  
3. **Build failures** - I'll debug container builds
4. **Resource conflicts** - I'll help resolve naming issues
5. **Network/timeout issues** - I'll adjust configurations

**Let's get this pipeline deployed!** 🚀