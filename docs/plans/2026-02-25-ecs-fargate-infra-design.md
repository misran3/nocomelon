# ECS Fargate Infrastructure Design

**Date:** 2026-02-25
**Status:** Approved

## Overview

Deploy the NoComelon FastAPI backend to AWS ECS Fargate with S3 storage for generated assets.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Environment | Single dev | Hackathon speed |
| File storage | S3 bucket | Persistence across container restarts |
| Networking | Public ALB, HTTP only | Simple, fast to deploy |
| Scaling | Single task, no auto-scaling | Predictable cost |
| Secrets | AWS Secrets Manager | Secure, best practice |
| Terraform structure | Single flat file | Maximum simplicity |
| AWS Provider | v6.33.0 | Latest |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Load Balancer                  │
│                   (HTTP:80 → target:8000)                   │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     ECS Fargate Service                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │               FastAPI Container                         │ │
│  │  - Port 8000                                           │ │
│  │  - CPU: 512, Memory: 1024                              │ │
│  │  - FFmpeg installed                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌───────────┐     ┌─────────────┐     ┌─────────────┐
    │    S3     │     │  Secrets    │     │   OpenAI    │
    │  Bucket   │     │  Manager    │     │ ElevenLabs  │
    │ (assets)  │     │ (API keys)  │     │   (APIs)    │
    └───────────┘     └─────────────┘     └─────────────┘
```

## Terraform Resources

| Resource | Purpose |
|----------|---------|
| `aws_ecr_repository` | Store Docker images |
| `aws_s3_bucket` | Store generated images, audio, videos |
| `aws_secretsmanager_secret` | Store OpenAI + ElevenLabs API keys |
| `aws_security_group` (ALB) | Allow HTTP:80 inbound |
| `aws_security_group` (ECS) | Allow ALB traffic only |
| `aws_lb` + listener + target group | Application Load Balancer |
| `aws_ecs_cluster` | Fargate cluster |
| `aws_ecs_task_definition` | Container specs |
| `aws_ecs_service` | Run and maintain tasks |
| `aws_iam_role` (execution) | Pull images, write logs |
| `aws_iam_role` (task) | Access S3, Secrets Manager |
| `aws_cloudwatch_log_group` | Container logs |

## S3 Structure

Multi-tenant structure for future Cognito integration:

```
<bucket>/<user_id>/images/*
<bucket>/<user_id>/audio/*
<bucket>/<user_id>/videos/*
```

Default `user_id="test"` for development.

## App Code Changes

### New `storage.py` module

- `upload_file(local_path, s3_key)` - Upload generated files
- `download_file(s3_key, local_path)` - Fetch files if needed
- `generate_presigned_url(s3_key)` - Return URLs for video results
- `get_user_prefix(user_id)` - Build S3 path prefix

### Updated `config.py`

```python
aws_region: str = "us-east-1"
s3_bucket_name: str  # Required
```

### Stage file updates

- `images.py`, `voice.py`, `video.py`: Upload generated files to S3, return S3 keys or presigned URLs

### New dependency

```
boto3>=1.38.0
```

## Files to Create

```
infrastructure/
├── main.tf
├── variables.tf
├── outputs.tf
└── terraform.tfvars.example

backend/packages/app/
├── Dockerfile
└── src/app/storage.py (new)
```

## Deployment Workflow

### Initial setup (one-time)

1. `cd infrastructure && terraform init`
2. Create `terraform.tfvars` with region, app name
3. `terraform apply` - creates all infrastructure
4. Add API keys to Secrets Manager via AWS Console

### Deploy app

1. Build: `docker build -t nocomeleon-app backend/packages/app/`
2. Tag and push to ECR
3. `terraform apply` - updates ECS task definition
4. ECS deploys new container

## Future Considerations

- Add Cognito authentication (user_id will be Cognito sub)
- Add HTTPS with ACM certificate
- Add CI/CD with GitHub Actions
- Add auto-scaling based on load
