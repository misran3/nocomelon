# Amplify Static Hosting Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy the frontend React SPA as a static site on AWS Amplify Hosting with Terraform IaC and manual ZIP deployments.

**Architecture:** Add aws_amplify_app and aws_amplify_branch resources to existing Terraform configuration. Create a deploy script that fetches environment variables from Terraform outputs, builds the frontend, and uploads to Amplify via AWS CLI.

**Tech Stack:** Terraform (AWS provider), AWS Amplify, Bash, AWS CLI, pnpm

---

### Task 1: Add Amplify App Terraform Resource

**Files:**
- Modify: `infrastructure/main.tf` (append after ECS Service block, line ~520)

**Step 1: Add Amplify app resource**

Add the following to `infrastructure/main.tf` after the ECS Service resource:

```hcl
# ------------------------------------------------------------------------------
# Amplify Hosting (Static Frontend)
# ------------------------------------------------------------------------------
resource "aws_amplify_app" "frontend" {
  name     = "${var.app_name}-frontend"
  platform = "WEB"

  # SPA redirect: all routes → index.html (except static assets)
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

**Step 2: Validate Terraform syntax**

Run: `terraform -chdir=infrastructure validate`
Expected: `Success! The configuration is valid.`

**Step 3: Commit**

```bash
git add infrastructure/main.tf
git commit -m "feat(infra): add Amplify app and branch resources"
```

---

### Task 2: Add Amplify Outputs

**Files:**
- Modify: `infrastructure/outputs.tf` (append at end)

**Step 1: Add Amplify outputs**

Add the following to `infrastructure/outputs.tf`:

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

**Step 2: Validate Terraform syntax**

Run: `terraform -chdir=infrastructure validate`
Expected: `Success! The configuration is valid.`

**Step 3: Commit**

```bash
git add infrastructure/outputs.tf
git commit -m "feat(infra): add Amplify output variables"
```

---

### Task 3: Create Deploy Script

**Files:**
- Create: `deploy-frontend.sh` (repository root)

**Step 1: Create the deploy script**

Create `deploy-frontend.sh` in the repository root:

```bash
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
```

**Step 2: Make script executable**

Run: `chmod +x deploy-frontend.sh`

**Step 3: Verify script syntax**

Run: `bash -n deploy-frontend.sh`
Expected: No output (no syntax errors)

**Step 4: Commit**

```bash
git add deploy-frontend.sh
git commit -m "feat: add deploy-frontend.sh script for Amplify deployments"
```

---

### Task 4: Apply Terraform Changes

**Files:**
- None (runtime operation)

**Step 1: Plan Terraform changes**

Run: `terraform -chdir=infrastructure plan`
Expected: Shows 2 resources to add:
- `aws_amplify_app.frontend`
- `aws_amplify_branch.main`

**Step 2: Apply Terraform changes**

Run: `terraform -chdir=infrastructure apply`
Expected: Prompts for confirmation, then creates resources

**Step 3: Verify outputs**

Run: `terraform -chdir=infrastructure output amplify_app_id`
Expected: Shows Amplify app ID (e.g., `d1234567890abc`)

---

### Task 5: Test Deployment

**Files:**
- None (runtime operation)

**Step 1: Run deploy script**

Run: `./deploy-frontend.sh`
Expected:
- Fetches env vars from Terraform
- Builds frontend successfully
- Creates zip file
- Uploads to Amplify
- Prints deployment URL

**Step 2: Verify deployment in browser**

Open the URL printed by the script (https://main.xxx.amplifyapp.com)
Expected:
- App loads without errors
- Navigation works (try /upload, /library routes)
- Check browser Network tab that API calls go to correct URL

**Step 3: Commit any fixes if needed**

If deployment revealed issues, fix and commit.

---

## Verification Checklist

After all tasks complete:

- [ ] `terraform -chdir=infrastructure validate` passes
- [ ] `terraform -chdir=infrastructure plan` shows no changes (already applied)
- [ ] `./deploy-frontend.sh` runs without errors
- [ ] App loads at Amplify URL
- [ ] SPA routing works (direct navigation to /upload works)
- [ ] API calls reach the backend (check Network tab)
- [ ] Cognito authentication works
