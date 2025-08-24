Awesome—let’s spin up a **complete Azure Serverless project** you can drop into a repo and deploy end-to-end.

This builds a small **Inventory API** on **Azure Functions (Python)** with **Cosmos DB (serverless)** + a **Queue-triggered worker** + a **Timer cleanup**. Infra is via **Terraform**; deploy via **CLI** or **GitHub Actions**.

---

# 1) Project layout

```
azure-serverless-inventory/
├─ infra/
│  ├─ main.tf
│  ├─ variables.tf
│  └─ outputs.tf
├─ functions/
│  ├─ host.json
│  ├─ local.settings.json.example
│  ├─ requirements.txt
│  ├─ InventoryApi/__init__.py
│  ├─ InventoryApi/function.json
│  ├─ QueueWorker/__init__.py
│  ├─ QueueWorker/function.json
│  ├─ NightlyCleanup/__init__.py
│  └─ NightlyCleanup/function.json
├─ .gitignore
├─ README.md
└─ .github/workflows/deploy.yml
```

---

## 2) Terraform (infra/main.tf)

```hcl
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.116"
    }
    random = {
      source = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "azurerm" {
  features {}
}

variable "prefix"   { type = string  default = "inv" }
variable "location" { type = string  default = "eastus" }

resource "azurerm_resource_group" "rg" {
  name     = "${var.prefix}-rg"
  location = var.location
}

resource "random_string" "suffix" {
  length  = 6
  upper   = false
  numeric = true
  special = false
}

# Storage (Functions runtime + Queue)
resource "azurerm_storage_account" "sa" {
  name                     = "${var.prefix}sa${random_string.suffix.result}"
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  allow_nested_items_to_be_public = false
}

resource "azurerm_storage_queue" "q" {
  name                 = "replenish-requests"
  storage_account_name = azurerm_storage_account.sa.name
}

# App Insights
resource "azurerm_application_insights" "ai" {
  name                = "${var.prefix}-ai-${random_string.suffix.result}"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  application_type    = "web"
}

# Cosmos DB (serverless, SQL API)
resource "azurerm_cosmosdb_account" "cdb" {
  name                = "${var.prefix}-cosmos-${random_string.suffix.result}"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  consistency_policy {
    consistency_level = "Session"
  }

  capabilities { name = "EnableServerless" }
  geo_location {
    location          = var.location
    failover_priority = 0
  }
}

resource "azurerm_cosmosdb_sql_database" "db" {
  name                = "inventorydb"
  resource_group_name = azurerm_resource_group.rg.name
  account_name        = azurerm_cosmosdb_account.cdb.name
}

resource "azurerm_cosmosdb_sql_container" "items" {
  name                = "items"
  resource_group_name = azurerm_resource_group.rg.name
  account_name        = azurerm_cosmosdb_account.cdb.name
  database_name       = azurerm_cosmosdb_sql_database.db.name
  partition_key_paths = ["/warehouseId"]
  indexing_policy { indexing_mode = "consistent" }
}

# Function App on Consumption plan (Linux / Python)
resource "azurerm_service_plan" "plan" {
  name                = "${var.prefix}-plan-${random_string.suffix.result}"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  os_type             = "Linux"
  sku_name            = "Y1" # Consumption
}

resource "azurerm_linux_function_app" "func" {
  name                = "${var.prefix}-func-${random_string.suffix.result}"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  service_plan_id     = azurerm_service_plan.plan.id
  storage_account_name       = azurerm_storage_account.sa.name
  storage_account_access_key = azurerm_storage_account.sa.primary_access_key
  functions_extension_version = "~4"

  site_config {
    application_stack {
      python_version = "3.10"
    }
    application_insights_key = azurerm_application_insights.ai.instrumentation_key
    app_command_line         = ""
    use_32_bit_worker        = false
    http2_enabled            = true
  }

  app_settings = {
    AzureWebJobsStorage                       = azurerm_storage_account.sa.primary_connection_string
    FUNCTIONS_WORKER_RUNTIME                  = "python"
    APPINSIGHTS_INSTRUMENTATIONKEY            = azurerm_application_insights.ai.instrumentation_key
    COSMOS_DB_ACCOUNT                         = azurerm_cosmosdb_account.cdb.endpoint
    COSMOS_DB_KEY                             = azurerm_cosmosdb_account.cdb.primary_key
    COSMOS_DB_DATABASE                        = azurerm_cosmosdb_sql_database.db.name
    COSMOS_DB_CONTAINER                       = azurerm_cosmosdb_sql_container.items.name
    QUEUE_NAME                                = azurerm_storage_queue.q.name
    WEBSITE_RUN_FROM_PACKAGE                  = "1"
  }

  identity { type = "SystemAssigned" }
}

output "function_app_name"   { value = azurerm_linux_function_app.func.name }
output "resource_group_name" { value = azurerm_resource_group.rg.name }
output "region"              { value = var.location }
```

`infra/variables.tf` (optional):

```hcl
variable "prefix"   { type = string }
variable "location" { type = string }
```

`infra/outputs.tf` included above.

**Init & apply:**

```bash
cd infra
terraform init
terraform apply -auto-approve -var="prefix=inv" -var="location=eastus"
```

---

## 3) Azure Functions (Python)

### `functions/requirements.txt`

```
azure-functions
azure-cosmos
azure-storage-queue
```

### `functions/host.json`

```json
{
  "version": "2.0",
  "extensions": {
    "http": { "routePrefix": "api" },
    "queues": { "maxDequeueCount": 5 }
  }
}
```

### `functions/local.settings.json.example`

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "python",
    "COSMOS_DB_ACCOUNT": "https://<yourcosmos>.documents.azure.com:443/",
    "COSMOS_DB_KEY": "<key>",
    "COSMOS_DB_DATABASE": "inventorydb",
    "COSMOS_DB_CONTAINER": "items",
    "QUEUE_NAME": "replenish-requests"
  }
}
```

> For local tests: install **Azurite** or use a real storage account; rename to `local.settings.json`.

---

### A) HTTP API — CRUD (InventoryApi)

`functions/InventoryApi/function.json`

```json
{
  "bindings": [
    {
      "authLevel": "Function",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": [ "get", "post", "put", "delete" ],
      "route": "items/{id?}"
    },
    { "type": "http", "direction": "out", "name": "res" }
  ]
}
```

`functions/InventoryApi/__init__.py`

```python
import json
import logging
import azure.functions as func
from azure.cosmos import CosmosClient, PartitionKey
import os

COSMOS_URI = os.getenv("COSMOS_DB_ACCOUNT")
COSMOS_KEY = os.getenv("COSMOS_DB_KEY")
DB_NAME = os.getenv("COSMOS_DB_DATABASE", "inventorydb")
CONTAINER_NAME = os.getenv("COSMOS_DB_CONTAINER", "items")

client = CosmosClient(COSMOS_URI, credential=COSMOS_KEY)
db = client.get_database_client(DB_NAME)
container = db.get_container_client(CONTAINER_NAME)

def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        method = req.method.upper()
        item_id = req.route_params.get("id")
        if method == "GET":
            if item_id:
                item = container.read_item(item=item_id, partition_key=req.params.get("warehouseId", "WH-DEFAULT"))
                return _ok(item)
            else:
                query = "SELECT * FROM c"
                items = list(container.query_items(query, enable_cross_partition_query=True))
                return _ok(items)

        body = req.get_json() if req.get_body() else {}
        if method == "POST":
            # body: {id, name, qty, warehouseId}
            body.setdefault("warehouseId", "WH-DEFAULT")
            container.create_item(body)
            return _created(body)

        if method == "PUT":
            if not item_id:
                return _bad("id route param required")
            existing = container.read_item(item=item_id, partition_key=body.get("warehouseId", "WH-DEFAULT"))
            existing.update(body)
            container.replace_item(item=existing, body=existing)
            return _ok(existing)

        if method == "DELETE":
            if not item_id:
                return _bad("id route param required")
            pk = req.params.get("warehouseId", "WH-DEFAULT")
            container.delete_item(item=item_id, partition_key=pk)
            return _no_content()

        return _bad("Unsupported method")
    except Exception as e:
        logging.exception("Error")
        return func.HttpResponse(str(e), status_code=500)

def _ok(payload):        return func.HttpResponse(json.dumps(payload), status_code=200, mimetype="application/json")
def _created(payload):   return func.HttpResponse(json.dumps(payload), status_code=201, mimetype="application/json")
def _no_content():       return func.HttpResponse("", status_code=204)
def _bad(msg):           return func.HttpResponse(json.dumps({"error": msg}), status_code=400, mimetype="application/json")
```

**Test locally:**

```bash
cd functions
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
func start
# GET all:     http://localhost:7071/api/items
# POST create: curl -X POST -H "Content-Type: application/json" -d '{"id":"A1","name":"Mouse","qty":10,"warehouseId":"WH-1"}' http://localhost:7071/api/items
```

---

### B) Queue-triggered worker (QueueWorker)

`functions/QueueWorker/function.json`

```json
{
  "bindings": [
    {
      "name": "msg",
      "type": "queueTrigger",
      "direction": "in",
      "queueName": "%QUEUE_NAME%",
      "connection": "AzureWebJobsStorage"
    }
  ]
}
```

`functions/QueueWorker/__init__.py`

```python
import json
import logging
from azure.cosmos import CosmosClient
import os

COSMOS_URI = os.getenv("COSMOS_DB_ACCOUNT")
COSMOS_KEY = os.getenv("COSMOS_DB_KEY")
DB_NAME = os.getenv("COSMOS_DB_DATABASE", "inventorydb")
CONTAINER_NAME = os.getenv("COSMOS_DB_CONTAINER", "items")

client = CosmosClient(COSMOS_URI, credential=COSMOS_KEY)
container = client.get_database_client(DB_NAME).get_container_client(CONTAINER_NAME)

def main(msg: str):
    data = json.loads(msg)
    item_id = data.get("id")
    warehouse = data.get("warehouseId", "WH-DEFAULT")
    logging.info(f"[QueueWorker] Replenish request received for item {item_id} @ {warehouse}")
    # Example side effect: increase qty by 50
    doc = container.read_item(item=item_id, partition_key=warehouse)
    doc["qty"] = int(doc.get("qty", 0)) + 50
    container.replace_item(doc, doc)
    logging.info(f"[QueueWorker] New qty: {doc['qty']}")
```

To enqueue messages locally:

```bash
az storage queue message put \
  --queue-name replenish-requests \
  --content '{"id":"A1","warehouseId":"WH-1"}' \
  --account-name <storageAccount> \
  --auth-mode login
```

---

### C) Timer trigger (NightlyCleanup)

`functions/NightlyCleanup/function.json`

```json
{
  "bindings": [
    {
      "name": "timer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "0 0 18 * * *"
    }
  ]
}
```

> Runs daily at **18:00 UTC** (≈ 11:30 PM IST—adjust as you like).

`functions/NightlyCleanup/__init__.py`

```python
import datetime
import logging

def main(timer) -> None:
    utc_now = datetime.datetime.utcnow().isoformat()
    logging.info(f"[Cleanup] Nightly job ran at {utc_now}Z")
    # Add tasks: archive old records, emit metrics, etc.
```

---

## 4) Deploy options

### Option A — Azure CLI (zip deploy)

```bash
# login & sub
az login
az account set --subscription "<SUB_ID>"

# Build zip package
cd functions
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt --target "./.python_packages/lib/site-packages"
zip -r ../package.zip * .python_packages

# Get names from Terraform outputs
cd ../infra
FUNC_APP=$(terraform output -raw function_app_name)
RG=$(terraform output -raw resource_group_name)

# Deploy
az functionapp deployment source config-zip \
  --resource-group "$RG" \
  --name "$FUNC_APP" \
  --src ../package.zip
```

**Get your API URL:**

```
https://<FUNC_APP>.azurewebsites.net/api/items
```

(Use a **Function Key** or set `authLevel: "Anonymous"` in `function.json` for testing.)

---

### Option B — GitHub Actions (`.github/workflows/deploy.yml`)

```yaml
name: Deploy Functions
on:
  push:
    branches: [ "main" ]

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with: { python-version: '3.10' }

      - name: Install deps
        working-directory: functions
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt --target ".python_packages/lib/site-packages"

      - name: Zip package
        run: |
          cd functions
          zip -r ../package.zip * .python_packages

      - name: Publish to Azure Functions
        uses: Azure/functions-action@v1
        with:
          app-name: ${{ secrets.AZURE_FUNCTIONAPP_NAME }}
          package: package.zip
          publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}
```

> In Azure Portal → your Function App → **Get publish profile**, save as repo secret `AZURE_PUBLISH_PROFILE`.
> Add `AZURE_FUNCTIONAPP_NAME` as another repo secret.

---

## 5) Useful CLI smoke tests

```bash
# Create a doc
curl -X POST -H "x-functions-key: <KEY>" -H "Content-Type: application/json" \
  -d '{"id":"A1","name":"Mouse","qty":10,"warehouseId":"WH-1"}' \
  https://<FUNC_APP>.azurewebsites.net/api/items

# Read all
curl -H "x-functions-key: <KEY>" https://<FUNC_APP>.azurewebsites.net/api/items

# Update qty
curl -X PUT -H "x-functions-key: <KEY>" -H "Content-Type: application/json" \
  -d '{"qty":25,"warehouseId":"WH-1"}' \
  https://<FUNC_APP>.azurewebsites.net/api/items/A1

# Delete
curl -X DELETE -H "x-functions-key: <KEY>" \
  "https://<FUNC_APP>.azurewebsites.net/api/items/A1?warehouseId=WH-1"
```

To trigger the queue worker:

```bash
az storage queue message put \
  --queue-name replenish-requests \
  --content '{"id":"A1","warehouseId":"WH-1"}' \
  --account-name <storageAccount> --auth-mode login
```

---

## 6) .gitignore (top-level)

```
# Python
functions/.venv/
__pycache__/
*.pyc
functions/.python_packages/
local.settings.json

# Terraform
infra/.terraform/
infra/.terraform.lock.hcl
terraform.tfstate*
```

---

## 7) README pointers (high level)

* Prereqs: Terraform, Azure CLI, Functions Core Tools, Python 3.10
* `terraform apply` to create infra
* Configure keys in `local.settings.json` to run locally
* Deploy via CLI or GitHub Actions
* API routes:

  * `GET /api/items`
  * `GET /api/items/{id}?warehouseId=...`
  * `POST /api/items`
  * `PUT /api/items/{id}`
  * `DELETE /api/items/{id}?warehouseId=...`

---

### Extras you can plug in later

* **Static Web Apps** frontend hitting this API
* **API Management** in front of the Function App (policies, rate-limit, JWT)
* **Key Vault** for secrets instead of app settings
* **Event Grid** trigger for blob uploads (e.g., import CSV to Cosmos)
* **Managed Identity** to access Cosmos without keys (swap SDK auth)

---

If you want, I can package this into a GitHub-ready repo (with README badges, diagrams, and sample requests) or switch runtime to **Node.js**/**.NET** and add **APIM**.
