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
├── function_app.py
├── requirements.txt
└── host.json
```

---

## 💻 Step 1: Prerequisites

Install:

* Python 3.8+
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
  --name mystorage98600 \
  --location eastus \
  --resource-group myRG \
  --sku Standard_LRS
```

### 4. Create Function App

```bash
az functionapp create \
  --resource-group myRG \
  --consumption-plan-location eastus \
  --runtime python \
  --runtime-version 3.10 \
  --functions-version 4 \
  --name my-func-app-12345 \
  --storage-account mystorage98600
```

---

## 🧑‍💻 Step 3: Code (Very Basic)

### 📄 `function_app.py`

```python
import azure.functions as func

app = func.FunctionApp()

@app.route(route="hello", methods=["GET"])
def hello(req: func.HttpRequest) -> func.HttpResponse:
    name = req.params.get('name')

    if not name:
        name = "World"

    return func.HttpResponse(
        f"Hello, {name}! This is Azure Serverless.",
        status_code=200
    )
```

---

### 📄 `requirements.txt`

```
azure-functions
```

---

### 📄 `host.json`

```json
{
  "version": "2.0"
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
