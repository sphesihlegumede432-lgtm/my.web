# FinServ Solutions - Customer Finance Hub

Node.js (Express) app for Azure App Service (PaaS).

## Features
- Loan repayment calculator with balance chart
- Money transfer / currency quote with fee (demo rates)
- Savings growth planner with chart
- Cloud Status tab: instance info + CPU load generator for autoscale testing

## Run locally
    npm install
    npm start        # http://localhost:8080

## Deploy to Azure (ZIP deploy)
1. Web App runtime: Node 20 LTS (Linux).
2. Zip the CONTENTS of this folder (package.json at the zip root).
3. az webapp deploy --resource-group PM01-RG-<StudentNumber> --name pm01-webapp-<StudentNumber> --src-path finserv-hub.zip --type zip
   Or Kudu > Tools > Zip Push Deploy.
4. Browse to https://pm01-webapp-<StudentNumber>.azurewebsites.net
