#!/bin/bash

# Master deployment script for DealBrief Scanner GCP Migration
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-precise-victory-467219-s4}"
REGION="${REGION:-us-west1}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

function log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

function success() {
    echo -e "${GREEN}✅ $1${NC}"
}

function warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

function error() {
    echo -e "${RED}❌ $1${NC}"
}

function check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if gcloud is authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        error "Not authenticated with gcloud. Run 'gcloud auth login'"
        exit 1
    fi
    
    # Check if correct project is set
    local current_project=$(gcloud config get-value project 2>/dev/null)
    if [[ "$current_project" != "$PROJECT_ID" ]]; then
        warning "Current project is $current_project, switching to $PROJECT_ID"
        gcloud config set project $PROJECT_ID
    fi
    
    # Check required APIs are enabled
    local required_apis=(
        "run.googleapis.com"
        "pubsub.googleapis.com" 
        "firestore.googleapis.com"
        "storage-api.googleapis.com"
        "artifactregistry.googleapis.com"
        "cloudbuild.googleapis.com"
        "secretmanager.googleapis.com"
    )
    
    for api in "${required_apis[@]}"; do
        if ! gcloud services list --enabled --filter="name:$api" --format="value(name)" | grep -q "$api"; then
            log "Enabling $api..."
            gcloud services enable "$api"
        fi
    done
    
    success "Prerequisites check passed"
}

function deploy_infrastructure() {
    log "🏗️  Deploying infrastructure..."
    
    cd "$(dirname "$0")/deploy"
    
    if [[ -f "./setup-pubsub.sh" ]]; then
        ./setup-pubsub.sh
        success "Infrastructure deployed"
    else
        error "setup-pubsub.sh not found"
        exit 1
    fi
}

function deploy_scanner_worker() {
    log "🔧 Deploying scanner worker..."
    
    cd "$(dirname "$0")/deploy"
    
    if [[ -f "./deploy-worker.sh" ]]; then
        ./deploy-worker.sh
        success "Scanner worker deployed"
    else
        error "deploy-worker.sh not found"
        exit 1
    fi
}

function deploy_report_generator() {
    log "📊 Deploying report generator..."
    
    cd "$(dirname "$0")/deploy"
    
    if [[ -f "./deploy-reports.sh" ]]; then
        ./deploy-reports.sh
        success "Report generator deployed"
    else
        error "deploy-reports.sh not found"
        exit 1
    fi
}

function run_tests() {
    log "🧪 Running end-to-end tests..."
    
    cd "$(dirname "$0")/test"
    
    if [[ -f "./test-workflow.sh" ]]; then
        # Run infrastructure test first
        if ./test-workflow.sh infra; then
            success "Infrastructure tests passed"
        else
            error "Infrastructure tests failed"
            return 1
        fi
        
        # Run a quick scan test
        log "Running scan test (this may take several minutes)..."
        if timeout 600 ./test-workflow.sh scan "vulnerable-test-site.vercel.app"; then
            success "Scan test passed"
        else
            warning "Scan test timed out or failed (this may be expected)"
        fi
    else
        warning "test-workflow.sh not found, skipping tests"
    fi
}

function show_summary() {
    log "📋 Deployment Summary"
    echo ""
    
    # Check service status
    echo "Cloud Run Services:"
    gcloud run services list --region=$REGION --format="table(metadata.name,status.url,status.conditions[0].type)" 2>/dev/null || echo "  Could not retrieve service status"
    
    echo ""
    echo "Pub/Sub Topics:"
    gcloud pubsub topics list --format="table(name)" 2>/dev/null || echo "  Could not retrieve topic status"
    
    echo ""
    echo "Pub/Sub Subscriptions:"
    gcloud pubsub subscriptions list --format="table(name,pushConfig.pushEndpoint)" 2>/dev/null || echo "  Could not retrieve subscription status"
    
    echo ""
    success "🎉 Deployment completed successfully!"
    
    echo ""
    echo "Next steps:"
    echo "1. Test the pipeline: cd test && ./test-workflow.sh complete"
    echo "2. Monitor logs: gcloud logs tail /projects/$PROJECT_ID/logs/run.googleapis.com%2Fstdout"
    echo "3. View service status: gcloud run services list --region=$REGION"
    echo ""
    echo "API Usage:"
    echo "- Create scan: POST https://dealbrief-api-242181373909.us-west1.run.app/scan"
    echo "- Direct Pub/Sub: gcloud pubsub topics publish scan-jobs --message='{\"scanId\":\"test\",\"domain\":\"example.com\"}'"
}

function cleanup_on_failure() {
    error "Deployment failed. Check the logs above for details."
    echo ""
    echo "To debug:"
    echo "1. Check individual deployment scripts in the deploy/ directory"
    echo "2. Verify all prerequisites are met"
    echo "3. Check GCP quotas and permissions"
    echo "4. Review Cloud Build logs if image builds failed"
    exit 1
}

# Main execution
function main() {
    log "🚀 Starting DealBrief Scanner GCP deployment..."
    echo "Project: $PROJECT_ID"
    echo "Region: $REGION"
    echo ""
    
    # Set error handler
    trap cleanup_on_failure ERR
    
    # Execute deployment steps
    check_prerequisites
    deploy_infrastructure
    deploy_scanner_worker
    deploy_report_generator
    
    # Optional testing
    if [[ "${SKIP_TESTS:-false}" != "true" ]]; then
        run_tests
    else
        warning "Skipping tests (SKIP_TESTS=true)"
    fi
    
    show_summary
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "infra")
        check_prerequisites
        deploy_infrastructure
        ;;
    "worker")
        check_prerequisites
        deploy_scanner_worker
        ;;
    "reports")
        check_prerequisites
        deploy_report_generator
        ;;
    "test")
        cd "$(dirname "$0")/test"
        ./test-workflow.sh complete
        ;;
    "status")
        show_summary
        ;;
    *)
        echo "Usage: $0 [deploy|infra|worker|reports|test|status]"
        echo ""
        echo "Commands:"
        echo "  deploy (default) - Deploy complete pipeline"
        echo "  infra           - Deploy infrastructure only"
        echo "  worker          - Deploy scanner worker only"
        echo "  reports         - Deploy report generator only"
        echo "  test            - Run end-to-end tests"
        echo "  status          - Show deployment status"
        echo ""
        echo "Environment variables:"
        echo "  PROJECT_ID      - GCP project ID (default: precise-victory-467219-s4)"
        echo "  REGION          - GCP region (default: us-west1)"
        echo "  SKIP_TESTS      - Skip tests during deployment (default: false)"
        exit 1
        ;;
esac