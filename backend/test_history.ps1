$token = "<PASTE_YOUR_ID_TOKEN_HERE>"

Invoke-RestMethod -Uri "http://localhost:4000/api/history" `
  -Method GET `
  -Headers @{
    "Authorization" = "Bearer $token"
  }
