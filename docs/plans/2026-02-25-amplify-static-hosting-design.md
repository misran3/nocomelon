# Amplify Static Hosting Design

**Date:** 2026-02-25
**Status:** Approved

## Overview

Deploy the frontend React SPA as a static site on AWS Amplify Hosting, managed via Terraform with manual ZIP deployments.

## Context

- Frontend is a pure Vite + React SPA with client-side routing
- Backend runs on ECS Fargate behind an ALB (already provisioned)
- Auth uses AWS Amplify SDK with Cognito (already provisioned)
- No server-side rendering required

## Decision

**Approach:** Amplify Hosting via Terraform with manual ZIP deployment

Rationale:
- Infrastructure as code consistency with existing ECS/Cognito setup
- Environment variables managed in single source of truth (Terraform outputs)
- SPA redirect rules declaratively configured
- No git integration required per user preference

## Architecture

```
┌─────────────────┐     ┌──────────────────┐
│  Amplify App    │────▶│  Static Assets   │
│  (Terraform)    │     │  (dist/)         │
└─────────────────┘     └──────────────────┘
        │                        │
        │                        ▼
        │               ┌──────────────────┐
        │               │  React SPA       │
        │               │  (Browser)       │
        │               └──────────────────┘
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│  Environment    │     │  Backend API     │
│  Variables      │────▶│  (ECS/ALB)       │
│  (Build-time)   │     └──────────────────┘
└─────────────────┘
```

## Implementation Details

### Terraform Resources

Add to `infrastructure/main.tf`:

```hcl
resource "aws_amplify_app" "frontend" {
  name     = "${var.app_name}-frontend"
  platform = "WEB"

  custom_rule {
    source = "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>"
    target = "/index.html"
    status = "200"
  }
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.frontend.id
  branch_name = "main"
  stage       = "PRODUCTION"
}
```

Add to `infrastructure/outputs.tf`:

```hcl
output "amplify_app_id" {
  description = "Amplify App ID for deployments"
  value       = aws_amplify_app.frontend.id
}

output "amplify_default_domain" {
  description = "Amplify default domain"
  value       = aws_amplify_app.frontend.default_domain
}
```

### Deploy Script

Create `deploy-frontend.sh` in repository root:

```bash
#!/bin/bash
set -e

INFRA_DIR="infrastructure"

# Fetch environment variables from Terraform outputs
export VITE_API_URL="http://$(terraform -chdir=$INFRA_DIR output -raw alb_dns_name)"
export VITE_COGNITO_USER_POOL_ID=$(terraform -chdir=$INFRA_DIR output -raw cognito_user_pool_id)
export VITE_COGNITO_CLIENT_ID=$(terraform -chdir=$INFRA_DIR output -raw cognito_client_id)
export VITE_COGNITO_IDENTITY_POOL_ID=$(terraform -chdir=$INFRA_DIR output -raw cognito_identity_pool_id)
export VITE_S3_BUCKET=$(terraform -chdir=$INFRA_DIR output -raw s3_bucket_name)
export VITE_AWS_REGION="us-east-1"

APP_ID=$(terraform -chdir=$INFRA_DIR output -raw amplify_app_id)

# Build frontend
cd frontend
pnpm build

# Create deployment artifact
cd dist
zip -r ../deploy.zip .
cd ..

# Deploy to Amplify
DEPLOYMENT=$(aws amplify create-deployment --app-id "$APP_ID" --branch-name "main" --output json)
JOB_ID=$(echo "$DEPLOYMENT" | jq -r '.jobId')
ZIP_URL=$(echo "$DEPLOYMENT" | jq -r '.zipUploadUrl')

curl -T deploy.zip "$ZIP_URL"
aws amplify start-deployment --app-id "$APP_ID" --branch-name "main" --job-id "$JOB_ID"

# Cleanup
rm deploy.zip
cd ..

echo "Deployment started! Job ID: $JOB_ID"
echo "URL: https://main.$(terraform -chdir=$INFRA_DIR output -raw amplify_default_domain)"
```

## Environment Variables

Baked into frontend at build time via Vite (VITE_* prefix):

| Variable | Source | Description |
|----------|--------|-------------|
| VITE_API_URL | terraform output alb_dns_name | Backend API endpoint |
| VITE_COGNITO_USER_POOL_ID | terraform output cognito_user_pool_id | Auth user pool |
| VITE_COGNITO_CLIENT_ID | terraform output cognito_client_id | Auth app client |
| VITE_COGNITO_IDENTITY_POOL_ID | terraform output cognito_identity_pool_id | Identity federation |
| VITE_S3_BUCKET | terraform output s3_bucket_name | Asset storage bucket |
| VITE_AWS_REGION | hardcoded | AWS region |

## SPA Routing

The custom_rule regex handles client-side routing:
- Requests for files with extensions (js, css, images) → served directly
- All other requests → rewritten to /index.html with 200 status
- React Router handles routing client-side

## Deployment Workflow

1. **One-time setup:** `terraform apply` creates Amplify app
2. **Each deployment:** `./deploy-frontend.sh`
   - Fetches current env vars from Terraform
   - Builds frontend with those values baked in
   - Uploads to Amplify

## Testing

- Verify redirect rules work for all routes (/upload, /library, etc.)
- Verify env vars are correctly injected (check Network tab for API calls)
- Verify Cognito auth flow works from Amplify domain

## Future Considerations

- Custom domain + HTTPS certificate
- Preview environments for PRs (would require git integration)
- CDN caching headers optimization
