param(
  [string]$OutputPath = "backups/recyclapp.dump",
  [string]$ContainerName = "recyclapp-postgres",
  [string]$DatabaseName = "recyclapp",
  [string]$DatabaseUser = "postgres"
)

$ErrorActionPreference = "Stop"

$repoPath = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$resolvedOutputPath = Join-Path $repoPath $OutputPath
$outputDirectory = Split-Path $resolvedOutputPath -Parent

if (!(Test-Path $outputDirectory)) {
  New-Item -ItemType Directory -Path $outputDirectory | Out-Null
}

Write-Host "Exportando dump desde $ContainerName..."

docker exec $ContainerName pg_dump `
  --username=$DatabaseUser `
  --dbname=$DatabaseName `
  --format=custom `
  --no-owner `
  --no-privileges `
  --file=/tmp/recyclapp.dump

docker cp "${ContainerName}:/tmp/recyclapp.dump" $resolvedOutputPath

Write-Host "Dump creado en $resolvedOutputPath"
