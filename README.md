# 🚀 Azure Serverless Project

## 📌 Project Name

**Serverless Hello API**

---

## 🎯 Aim

Create a simple serverless API that returns a response using Azure Functions.

---

## 🧩 Services Used

* ⚡ Azure Functions (Node.js 20 Runtime)
* 📦 Azure Storage Account
* 📊 Application Insights (Auto-configured)

---

## 🏗️ Architecture

```
Client (Browser / Postman / API Request)
        ↓
Azure Function App (HTTP Trigger - Anonymous Auth)
        ↓
hello Function (GET/POST)
        ↓
JSON Response: "Hello, {name}! This is Azure Serverless."
```

---

## 📂 Project Structure

```
azure-serverless-project/
│
├── src/
│   └── functions/
│       └── hello.js          # HTTP trigger function
├── package.json              # Node.js dependencies
├── host.json                 # Function App configuration
├── .funcignore              # Files to exclude from deployment
└── README.md                # This file
```

---

## 💻 Prerequisites

Install the following tools:

* **Node.js 20+** - [Download](https://nodejs.org/)
* **Azure CLI** - [Installation Guide](https://docs.microsoft.com/cli/azure/install-azure-cli)
* **Azure Functions Core Tools** - [Installation Guide](https://docs.microsoft.com/azure/azure-functions/functions-run-local)

---

## 🚀 Deployment Guide

### Step 1: Login to Azure

```bash
az login
```

### Step 2: Create Azure Resources

#### Create Resource Group

```bash
az group create \
  --name rg-serverless \
  --location eastus
```

#### Create Storage Account

```bash
az storage account create \
  --name stfuncunique123 \
  --location eastus \
  --resource-group rg-serverless \
  --sku Standard_LRS \
  --kind StorageV2
```

#### Create Function App

```bash
az functionapp create \
  --resource-group rg-serverless \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --name func-hello-unique123 \
  --storage-account stfuncunique123 \
  --os-type Linux
```

> **Note:** Replace `unique123` with a unique identifier (e.g., timestamp or random number) as Azure resource names must be globally unique.

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Deploy to Azure

```bash
func azure functionapp publish func-hello-unique123 --javascript --build remote
```

Replace `func-hello-unique123` with your actual Function App name.

**Important:** Use `--build remote` to build on Azure's infrastructure for better compatibility.

---

## ✅ Deployed Project Information

This project has been successfully deployed to Azure with the following resources:

### Resource Details

| Resource Type       | Name                      | Details                           |
|---------------------|---------------------------|-----------------------------------|
| Resource Group      | `rg-serverless-1775269317` | Location: East US                |
| Storage Account     | `stfunc1775269317`         | SKU: Standard_LRS                |
| Function App        | `func-hello-1775269317`    | Runtime: Node.js 20, Linux       |
| Application Insights| `func-hello-1775269317`    | Auto-configured monitoring       |

### 🌐 Live URLs

**Function App URL:**
```
https://func-hello-1775269317.azurewebsites.net
```

**Hello Function Endpoint:**
```
https://func-hello-1775269317.azurewebsites.net/api/hello
```

### Test the Function

**Basic Request:**
```bash
curl "https://func-hello-1775269317.azurewebsites.net/api/hello"
```

**Response:**
```
Hello, World! This is Azure Serverless.
```

**With Query Parameter:**
```bash
curl "https://func-hello-1775269317.azurewebsites.net/api/hello?name=Azure"
```

**Response:**
```
Hello, Azure! This is Azure Serverless.
```

**POST Request with Body:**
```bash
curl -X POST "https://func-hello-1775269317.azurewebsites.net/api/hello" \
  -H "Content-Type: text/plain" \
  -d "Developer"
```

**Response:**
```
Hello, Developer! This is Azure Serverless.
```

---

## 🧪 Local Development

### Run Locally

```bash
npm start
```

This will start the Azure Functions runtime locally at `http://localhost:7071`

### Test Locally

```bash
curl "http://localhost:7071/api/hello?name=Local"
```

---

## 📝 Function Details

### HTTP Trigger Configuration

- **Function Name:** `hello`
- **HTTP Methods:** GET, POST
- **Auth Level:** Anonymous (no authentication required)
- **Route:** `/api/hello`

### Code Location

The function code is located at [src/functions/hello.js](src/functions/hello.js)

### How It Works

1. Function receives HTTP request (GET or POST)
2. Extracts `name` from:
   - Query parameter: `?name=yourname`
   - POST body (plain text)
   - Defaults to "World" if not provided
3. Returns response: `Hello, {name}! This is Azure Serverless.`

---

## 📊 Monitoring

Application Insights is automatically configured for this Function App.

**View Logs:**

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to your Function App: `func-hello-1775269317`
3. Click on **Application Insights** → **View Application Insights data**
4. Monitor requests, failures, performance metrics

---

## 🧹 Cleanup Resources

To avoid incurring charges, delete the resource group when done:

```bash
az group delete --name rg-serverless-1775269317 --yes --no-wait
```

---

## 🛠️ Troubleshooting

### Function returns 503 Service Unavailable
- Wait 30-60 seconds after deployment for cold start
- Restart the function app: `az functionapp restart --name func-hello-1775269317 --resource-group rg-serverless-1775269317`

### Deployment fails
- Ensure Azure Functions Core Tools is installed
- Check that you're logged in: `az account show`
- Verify storage account and function app names are globally unique

### Local development issues
- Ensure port 7071 is not in use
- Check Node.js version: `node --version` (should be 20+)
- Run `npm install` to ensure dependencies are installed

---

## 📚 Additional Resources

- [Azure Functions Documentation](https://docs.microsoft.com/azure/azure-functions/)
- [Azure Functions Node.js Developer Guide](https://docs.microsoft.com/azure/azure-functions/functions-reference-node)
- [HTTP Trigger Reference](https://docs.microsoft.com/azure/azure-functions/functions-bindings-http-webhook)
- [Best Practices for Azure Functions](https://docs.microsoft.com/azure/azure-functions/functions-best-practices)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**✨ Project successfully deployed and running on Azure! ✨**


```javascript
const { app } = require('@azure/functions');

app.http('hello', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request.');

        const name = request.query.get('name') || await request.text() || 'World';

        return { 
            status: 200,
            body: `Hello, ${name}! This is Azure Serverless.`
        };
    }
});
```

---

### 📄 `package.json`

```json
{
  "name": "azure-serverless-hello-api",
  "version": "1.0.0",
  "description": "Simple serverless API using Azure Functions with Node.js",
  "scripts": {
    "start": "func start",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "@azure/functions": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.x"
  },
  "main": "srcInstall Dependencies & Deploy

### Install Node.js dependencies:

```bash
npm install
```

### Test locally:

```bash
npm start
```

### Deploy to Azure:",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

### 📄 `host.json`

```json
{
  "version": "2.0",
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "maxTelemetryItemsPerSecond": 20
      }
    }
  },
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  }
}
```

---

## 🚀 Step 4: Deploy Function

```bash
func azure functionapp publish my-func-app-12345
```

---

## 🌐 Step 5: Test API

Open in browser / Postman:

```
https://my-func-app-12345.azurewebsites.net/api/hello?name=Atul
```

### ✅ Output

```
Hello, Atul! This is Azure Serverless.
```

---

## 📊 Key Concepts (Exam / Interview Ready)

* Serverless = No VM management
* Auto scaling (Consumption Plan)
* Pay per execution
* HTTP Trigger = API endpoint
* Storage Account = Mandatory backend

---

## 📌 Conclusion

This is the **simplest Azure serverless project**:

* Only **2 services used**
* No database, no extra complexity
* Perfect for **AZ-104 / AZ-204 basics + demo**

---
