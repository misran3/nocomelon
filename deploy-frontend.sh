#!/bin/bash
set -e

echo "=== Frontend Deployment to Amplify ==="

INFRA_DIR="infrastructure"

# Check dependencies
command -v terraform >/dev/null 2>&1 || { echo "Error: terraform not found"; exit 1; }
command -v aws >/dev/null 2>&1 || { echo "Error: aws cli not found"; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "Error: jq not found"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "Error: pnpm not found"; exit 1; }

# Fetch environment variables from Terraform outputs
echo "Fetching environment variables from Terraform..."
export VITE_API_URL="http://$(terraform -chdir=$INFRA_DIR output -raw alb_dns_name)"
export VITE_COGNITO_USER_POOL_ID=$(terraform -chdir=$INFRA_DIR output -raw cognito_user_pool_id)
export VITE_COGNITO_CLIENT_ID=$(terraform -chdir=$INFRA_DIR output -raw cognito_client_id)
export VITE_COGNITO_IDENTITY_POOL_ID=$(terraform -chdir=$INFRA_DIR output -raw cognito_identity_pool_id)
export VITE_S3_BUCKET=$(terraform -chdir=$INFRA_DIR output -raw s3_bucket_name)
export VITE_AWS_REGION="us-east-1"

APP_ID=$(terraform -chdir=$INFRA_DIR output -raw amplify_app_id)
BRANCH_NAME="main"

echo "Environment variables set:"
echo "  VITE_API_URL: $VITE_API_URL"
echo "  VITE_COGNITO_USER_POOL_ID: $VITE_COGNITO_USER_POOL_ID"
echo "  VITE_S3_BUCKET: $VITE_S3_BUCKET"

# Build frontend
echo "Building frontend..."
cd frontend
pnpm build

# Create deployment artifact
echo "Creating deployment artifact..."
cd dist
zip -r ../deploy.zip .
cd ..

# Deploy to Amplify
echo "Creating Amplify deployment..."
DEPLOYMENT=$(aws amplify create-deployment --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --output json)
JOB_ID=$(echo "$DEPLOYMENT" | jq -r '.jobId')
ZIP_URL=$(echo "$DEPLOYMENT" | jq -r '.zipUploadUrl')

echo "Uploading to Amplify (Job ID: $JOB_ID)..."
curl --silent -T deploy.zip "$ZIP_URL"

echo "Starting deployment..."
aws amplify start-deployment --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --job-id "$JOB_ID"

# Cleanup
rm deploy.zip
cd ..

echo ""
echo "=== Deployment Started ==="
echo "Job ID: $JOB_ID"
echo "URL: https://${BRANCH_NAME}.$(terraform -chdir=$INFRA_DIR output -raw amplify_default_domain)"
