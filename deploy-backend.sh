#!/bin/bash
set -euo pipefail

# Deploy script for NoComelon API
# Usage: ./deploy.sh [--skip-build]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$SCRIPT_DIR/infrastructure"
APP_DIR="$SCRIPT_DIR/backend/packages/app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Parse arguments
SKIP_BUILD=false
for arg in "$@"; do
    case $arg in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
    esac
done

# Check prerequisites
command -v docker >/dev/null 2>&1 || { log_error "Docker is required but not installed."; exit 1; }
command -v aws >/dev/null 2>&1 || { log_error "AWS CLI is required but not installed."; exit 1; }
command -v terraform >/dev/null 2>&1 || { log_error "Terraform is required but not installed."; exit 1; }

# Get Terraform outputs
log_info "Fetching Terraform outputs..."

if ! terraform -chdir="$INFRA_DIR" output >/dev/null 2>&1; then
    log_error "Terraform outputs not available. Run 'terraform apply' first."
    exit 1
fi

ECR_URL=$(terraform -chdir="$INFRA_DIR" output -raw ecr_repository_url)
ECS_CLUSTER=$(terraform -chdir="$INFRA_DIR" output -raw ecs_cluster_name)
ECS_SERVICE=$(terraform -chdir="$INFRA_DIR" output -raw ecs_service_name)
OPENAI_SECRET_ARN=$(terraform -chdir="$INFRA_DIR" output -raw openai_secret_arn)
ELEVENLABS_SECRET_ARN=$(terraform -chdir="$INFRA_DIR" output -raw elevenlabs_secret_arn)
AWS_REGION=$(aws configure get region 2>/dev/null || echo "us-east-1")

log_info "ECR Repository: $ECR_URL"
log_info "ECS Cluster: $ECS_CLUSTER"
log_info "ECS Service: $ECS_SERVICE"
log_info "AWS Region: $AWS_REGION"

# ------------------------------------------------------------------------------
# Ensure secrets are populated
# ------------------------------------------------------------------------------
check_and_set_secret() {
    local secret_arn="$1"
    local env_var_name="$2"
    local env_var_value="${!env_var_name:-}"
    local secret_name=$(echo "$secret_arn" | sed 's/.*secret://' | sed 's/-[^-]*$//')

    # Check if secret has a value
    if aws secretsmanager get-secret-value --secret-id "$secret_arn" --region "$AWS_REGION" >/dev/null 2>&1; then
        log_info "Secret $secret_name already has a value"
        return 0
    fi

    # Secret has no value - try to set from env var
    if [ -z "$env_var_value" ]; then
        log_error "Secret $secret_name has no value and $env_var_name environment variable is not set"
        log_error "Either set $env_var_name or run:"
        log_error "  aws secretsmanager put-secret-value --secret-id $secret_arn --secret-string 'your-key'"
        return 1
    fi

    log_info "Setting secret $secret_name from $env_var_name environment variable..."
    aws secretsmanager put-secret-value \
        --secret-id "$secret_arn" \
        --secret-string "$env_var_value" \
        --region "$AWS_REGION" >/dev/null
    log_info "Secret $secret_name set successfully"
}

log_info "Checking secrets..."
SECRETS_OK=true
check_and_set_secret "$OPENAI_SECRET_ARN" "OPENAI_API_KEY" || SECRETS_OK=false
check_and_set_secret "$ELEVENLABS_SECRET_ARN" "ELEVENLABS_API_KEY" || SECRETS_OK=false

if [ "$SECRETS_OK" = false ]; then
    log_error "Missing secrets. Set environment variables and retry:"
    log_error "  export OPENAI_API_KEY='sk-...'"
    log_error "  export ELEVENLABS_API_KEY='...'"
    exit 1
fi

# Authenticate with ECR
log_info "Authenticating with ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_URL"

if [ "$SKIP_BUILD" = false ]; then
    # Build Docker image for linux/amd64 using buildx (required for ECS Fargate)
    log_info "Building Docker image for linux/amd64 with buildx..."
    cd "$APP_DIR"
    docker buildx build \
        --platform linux/amd64 \
        --tag "$ECR_URL:latest" \
        --push \
        .
else
    log_warn "Skipping build (--skip-build flag set)"
fi

# Force new deployment
log_info "Forcing ECS service deployment..."
aws ecs update-service \
    --cluster "$ECS_CLUSTER" \
    --service "$ECS_SERVICE" \
    --force-new-deployment \
    --region "$AWS_REGION" \
    --no-cli-pager

# Wait for deployment (optional)
log_info "Deployment initiated. Waiting for service to stabilize..."
aws ecs wait services-stable \
    --cluster "$ECS_CLUSTER" \
    --services "$ECS_SERVICE" \
    --region "$AWS_REGION" 2>/dev/null || log_warn "Timeout waiting for service - check AWS console"

# Get ALB URL
ALB_URL=$(terraform -chdir="$INFRA_DIR" output -raw alb_url)

echo ""
log_info "Deployment complete!"
echo -e "${GREEN}Application URL:${NC} $ALB_URL"
echo -e "${GREEN}Health check:${NC} $ALB_URL/health"
echo ""
log_info "To view logs: aws logs tail /ecs/nocomeleon --follow"
