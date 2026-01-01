$QuizzesDir = "C:\Users\asus\neet-rank-predictor\backend\data\quizzes"

# Create Directories
$Dirs = "Physics", "Chemistry", "Botany", "Zoology"
foreach ($Dir in $Dirs) {
    $Path = Join-Path $QuizzesDir $Dir
    if (!(Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
        Write-Host "Created $Dir"
    }
}

# Move Files Logic
$Files = Get-ChildItem -Path $QuizzesDir -File

foreach ($File in $Files) {
    $Name = $File.Name.ToLower()
    $Dest = $null

    if ($Name.StartsWith("b ") -or $Name.StartsWith("botany")) { $Dest = "Botany" }
    elseif ($Name.StartsWith("z ") -or $Name.StartsWith("zoology")) { $Dest = "Zoology" }
    elseif ($Name.StartsWith("physics") -or $Name -match "kinematics|optics|motion|electric|thermo|magnet|waves|work|current|atoms|nuclei") { $Dest = "Physics" }
    elseif ($Name.StartsWith("chemistry") -or $Name -match "bonding|atomic|periodicity|solution|equilibrium|hydrocarbon|organic|inorganic|halo|amine|alcohol|aldehyde|redox|structure of atom|d and f") { $Dest = "Chemistry" }

    if ($Dest) {
        $DestPath = Join-Path $QuizzesDir $Dest
        Move-Item -Path $File.FullName -Destination $DestPath -Force
        Write-Host "Moved $($File.Name) to $Dest"
    }
}
Write-Host "Done."
