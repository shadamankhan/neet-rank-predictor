$ErrorActionPreference = "Stop"
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/predict" `
      -Method POST `
      -Headers @{ "Content-Type"="application/json" } `
      -Body '{ "score": 650, "year": 2024 }'
    
    Write-Host "Response received:"
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd()
        Write-Host "Server Error Body: $body"
    }
}
