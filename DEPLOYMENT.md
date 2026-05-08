# MediaShare — Azure Deployment Guide

## Prerequisites

- Azure CLI installed (`az` command)
- Azure subscription
- Node.js 18+

## Step 1: Create Resource Group

```bash
az group create --name mediashare-rg --location eastus
```

## Step 2: Provision Azure Cosmos DB (NoSQL / Serverless)

```bash
# Create Cosmos DB account (serverless for cost efficiency)
az cosmosdb create \
  --name mediashare-cosmos \
  --resource-group mediashare-rg \
  --kind GlobalDocumentDB \
  --capabilities EnableServerless \
  --default-consistency-level Session

# Get connection details
az cosmosdb keys list \
  --name mediashare-cosmos \
  --resource-group mediashare-rg

az cosmosdb show \
  --name mediashare-cosmos \
  --resource-group mediashare-rg \
  --query documentEndpoint
```

> **Note**: The database and containers are automatically created on first API call.

## Step 3: Provision Azure Blob Storage

```bash
# Create storage account
az storage account create \
  --name mediashareblob \
  --resource-group mediashare-rg \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2

# Get connection string
az storage account show-connection-string \
  --name mediashareblob \
  --resource-group mediashare-rg

# Create container (optional — app creates it automatically)
az storage container create \
  --name media \
  --account-name mediashareblob \
  --public-access blob
```

## Step 4: Provision Azure AI Vision (Computer Vision)

```bash
az cognitiveservices account create \
  --name mediashare-vision \
  --resource-group mediashare-rg \
  --kind ComputerVision \
  --sku F0 \
  --location eastus \
  --yes

# Get keys
az cognitiveservices account keys list \
  --name mediashare-vision \
  --resource-group mediashare-rg

# Get endpoint
az cognitiveservices account show \
  --name mediashare-vision \
  --resource-group mediashare-rg \
  --query properties.endpoint
```

> **Note**: Use `F0` (free tier) for development. Switch to `S1` for production.

## Step 5: Provision Azure AI Content Safety

```bash
az cognitiveservices account create \
  --name mediashare-safety \
  --resource-group mediashare-rg \
  --kind ContentSafety \
  --sku F0 \
  --location eastus \
  --yes

# Get keys
az cognitiveservices account keys list \
  --name mediashare-safety \
  --resource-group mediashare-rg

# Get endpoint
az cognitiveservices account show \
  --name mediashare-safety \
  --resource-group mediashare-rg \
  --query properties.endpoint
```

## Step 6: Create Azure App Service

```bash
# Create App Service plan (B1 for Node.js)
az appservice plan create \
  --name mediashare-plan \
  --resource-group mediashare-rg \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --name mediashare-app \
  --resource-group mediashare-rg \
  --plan mediashare-plan \
  --runtime "NODE:20-lts"
```

## Step 7: Configure Environment Variables

```bash
az webapp config appsettings set \
  --name mediashare-app \
  --resource-group mediashare-rg \
  --settings \
    NODE_ENV=production \
    JWT_SECRET="your-production-secret-key" \
    COSMOS_ENDPOINT="https://mediashare-cosmos.documents.azure.com:443/" \
    COSMOS_KEY="your-cosmos-key" \
    COSMOS_DATABASE="mediashare" \
    STORAGE_CONNECTION_STRING="your-storage-connection-string" \
    STORAGE_CONTAINER_NAME="media" \
    VISION_ENDPOINT="https://eastus.api.cognitive.microsoft.com/" \
    VISION_KEY="your-vision-key" \
    CONTENT_SAFETY_ENDPOINT="https://eastus.cognitiveservices.azure.com/" \
    CONTENT_SAFETY_KEY="your-safety-key"
```

## Step 8: Deploy

### Option A: ZIP Deploy (Simplest)

```bash
# Build the app
npm run build

# Create deployment package
zip -r deploy.zip .next package.json node_modules public next.config.mjs

# Deploy
az webapp deploy \
  --name mediashare-app \
  --resource-group mediashare-rg \
  --src-path deploy.zip \
  --type zip
```

### Option B: GitHub Actions (Recommended)

1. Push code to GitHub
2. In Azure Portal → App Service → Deployment Center
3. Connect to your GitHub repository
4. Azure automatically creates a GitHub Actions workflow

### Custom Startup Command

Set the startup command for Next.js:

```bash
az webapp config set \
  --name mediashare-app \
  --resource-group mediashare-rg \
  --startup-file "npm run start"
```

## Step 9: Verify Deployment

```bash
# Check health endpoint
curl https://mediashare-app.azurewebsites.net/api/health

# View logs
az webapp log tail \
  --name mediashare-app \
  --resource-group mediashare-rg
```

## Cost Estimates (Free/Dev Tier)

| Service | SKU | Monthly Cost |
|---------|-----|-------------|
| Cosmos DB | Serverless | ~$0-5 (pay per request) |
| Blob Storage | Standard LRS | ~$0.02/GB |
| Computer Vision | F0 (Free) | $0 (5K calls/month) |
| Content Safety | F0 (Free) | $0 (5K calls/month) |
| App Service | B1 | ~$13/month |
| **Total** | | **~$15-20/month** |

## Cleanup

```bash
az group delete --name mediashare-rg --yes --no-wait
```
