# 🚀 Azure Serverless Project (Minimal Setup)

## 📌 Project Name

**Serverless Hello API**

---

## 🎯 Aim

Create a simple serverless API that returns a response using Azure Functions.

---

## 🧩 Services Used (Minimum)

* ⚡ Azure Functions
* 📦 Azure Storage Account

---

## 🏗️ Architecture (Simple)

```
Client (Browser / Postman)
        ↓
Azure Function (HTTP Trigger)
        ↓
Response (JSON)
```

---

## 📂 Project Structure

```
serverless-app/
│
├── src/
│   └── functions/
│       └── hello.js
├── package.json
└── host.json
```

---

## 💻 Step 1: Prerequisites

Install:

* Node.js 18+ (LTS recommended)
* Azure CLI
* Azure Functions Core Tools

---

## ⚙️ Step 2: Create Azure Resources

### 1. Login

```bash
az login
```

### 2. Create Resource Group

```bash
az group create --name myRG --location eastus
```

### 3. Create Storage Account

```bash
az storage account create \
  --name mystorage12345 \
  --location eastus \
  --resource-group myRG \
  --sku Standard_LRS
```

### 4. Create Function App

```bash
az functionapp create \
  --resourcenode \
  --runtime-version 18ation eastus \
  --runtime python \
  --runtime-version 3.10 \
  --functions-version 4 \
  --name my-func-app-12345 \
  --storage-account mystorage12345
```

---

## 🧑‍💻 Step 3: Code (Very Basic)

### 📄 `src/functions/hello.js`

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
