# Azure Deployment Information

## Created Resources

- **Resource Group:** rg-serverless-1775269317
- **Storage Account:** stfunc1775269317
- **Function App:** func-hello-1775269317
- **Application Insights:** func-hello-1775269317

## URLs

- **Function App:** https://func-hello-1775269317.azurewebsites.net
- **Hello Function:** https://func-hello-1775269317.azurewebsites.net/api/hello

## Deployment Command

To redeploy or update the function:

```bash
func azure functionapp publish func-hello-1775269317 --javascript --build remote
```

**Note:** The `--build remote` flag is important for proper deployment. It builds the project on Azure's infrastructure.

## Test Commands

```bash
# Test with default name (World)
curl "https://func-hello-1775269317.azurewebsites.net/api/hello"

# Test with query parameter
curl "https://func-hello-1775269317.azurewebsites.net/api/hello?name=Azure"

# Test with POST body
curl -X POST "https://func-hello-1775269317.azurewebsites.net/api/hello" \
  -H "Content-Type: text/plain" \
  -d "Developer"
```

## Cleanup

To delete all resources:

```bash
az group delete --name rg-serverless-1775269317 --yes --no-wait
```
