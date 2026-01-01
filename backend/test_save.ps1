$token = "<PASTE_YOUR_ID_TOKEN_HERE>"

Invoke-RestMethod -Uri "http://localhost:4000/api/savePrediction" `
  -Method POST `
  -Headers @{ 
    "Content-Type" = "application/json";
    "Authorization" = "Bearer $token"
  } `
  -Body '{
    "score": 550,
    "predictedRank": "120001-130000",
    "percentile": 94.5
  }'
