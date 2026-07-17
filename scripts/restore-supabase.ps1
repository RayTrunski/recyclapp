param(
  [string]$DumpPath = "backups/recyclapp.dump",
  [string]$ViewsPath = "database/views/01_read_views.sql",
  [string]$PrepareSqlPath = "database/supabase/01_prepare_target.sql",
  [string]$ExposeSchemaSqlPath = "database/supabase/02_expose_custom_schema.sql",
  [string]$VerifySqlPath = "database/supabase/03_verify_migration.sql",
  [switch]$SkipExposeSchema
)

$ErrorActionPreference = "Stop"

function Get-RepoPath {
  return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

function Import-DotEnv {
  $envPath = Join-Path (Get-RepoPath) ".env"

  if (!(Test-Path $envPath)) {
    return
  }

  $lineNumber = 0

  foreach ($rawLine in Get-Content $envPath) {
    $lineNumber++
    $line = $rawLine.Trim()

    if (!$line -or $line.StartsWith("#")) {
      continue
    }

    if ($line -notmatch "^[A-Za-z_][A-Za-z0-9_]*=") {
      if ($line -match "^postgres(ql)?://") {
        throw "La linea $lineNumber de .env contiene una URL de PostgreSQL sin nombre de variable. Usa SUPABASE_DB_URL=`"postgresql://...`" o DATABASE_URL=`"postgresql://...`"."
      }

      continue
    }

    $name, $value = $line -split "=", 2
    $value = $value.Trim()

    if (
      ($value.StartsWith('"') -and $value.EndsWith('"')) -or
      ($value.StartsWith("'") -and $value.EndsWith("'"))
    ) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
  }
}

function Get-TargetConnectionString {
  if ($env:SUPABASE_DB_URL) {
    return $env:SUPABASE_DB_URL
  }

  if (
    $env:DATABASE_URL -and
    $env:DATABASE_URL -notmatch "localhost" -and
    $env:DATABASE_URL -notmatch "127\.0\.0\.1"
  ) {
    return $env:DATABASE_URL
  }

  throw "No encontre SUPABASE_DB_URL. Copia en .env la cadena PostgreSQL de Supabase con password."
}

function Show-ConnectionHints {
  param(
    [string]$ConnectionString
  )

  if ($ConnectionString -match "@db\.[^.]+\.supabase\.co:5432/") {
    Write-Warning "Estas usando el host directo db.<project-ref>.supabase.co:5432. Para migraciones desde Docker, Supabase recomienda usar Session pooler en puerto 5432."
    Write-Warning "Copia la cadena desde Project > Settings > Database > Connection pooling > Session pooler."
  }
}

function Run-PostgresTool {
  param(
    [string]$Step,
    [string[]]$Arguments
  )

  $repoPath = Get-RepoPath
  $mountPath = "${repoPath}:/workspace"

  docker run --rm `
    -v $mountPath `
    -w /workspace `
    -e "PGPASSWORD=$env:PGPASSWORD" `
    postgres:16-alpine @Arguments

  if ($LASTEXITCODE -ne 0) {
    throw "Fallo el paso '$Step' con codigo de salida $LASTEXITCODE."
  }
}

$repoPath = Get-RepoPath
$resolvedDumpPath = Join-Path $repoPath $DumpPath
$resolvedViewsPath = Join-Path $repoPath $ViewsPath
$resolvedPrepareSqlPath = Join-Path $repoPath $PrepareSqlPath
$resolvedExposeSchemaSqlPath = Join-Path $repoPath $ExposeSchemaSqlPath
$resolvedVerifySqlPath = Join-Path $repoPath $VerifySqlPath

if (!(Test-Path $resolvedDumpPath)) {
  throw "No existe el dump en $resolvedDumpPath"
}

if (!(Test-Path $resolvedViewsPath)) {
  throw "No existe el archivo de vistas en $resolvedViewsPath"
}

Import-DotEnv
$targetDbUrl = Get-TargetConnectionString
Show-ConnectionHints -ConnectionString $targetDbUrl

Write-Host "1/5 Preparando extension y esquema destino..."
Run-PostgresTool -Step "Preparando extension y esquema destino" -Arguments @(
  "psql",
  $targetDbUrl,
  "-v", "ON_ERROR_STOP=1",
  "-f", $PrepareSqlPath
)

Write-Host "2/5 Restaurando tablas, tipos, constraints e indices..."
Run-PostgresTool -Step "Restaurando tablas y datos" -Arguments @(
  "pg_restore",
  "--dbname=$targetDbUrl",
  "--schema=recyclapp_schema",
  "--clean",
  "--if-exists",
  "--no-owner",
  "--no-privileges",
  "--exit-on-error",
  "--single-transaction",
  $DumpPath
)

Write-Host "3/5 Recreando vistas de lectura..."
Run-PostgresTool -Step "Recreando vistas de lectura" -Arguments @(
  "psql",
  $targetDbUrl,
  "-v", "ON_ERROR_STOP=1",
  "-f", $ViewsPath
)

if (!$SkipExposeSchema) {
  Write-Host "4/5 Aplicando grants para exponer el schema en Supabase..."
  Run-PostgresTool -Step "Aplicando grants del schema custom" -Arguments @(
    "psql",
    $targetDbUrl,
    "-v", "ON_ERROR_STOP=1",
    "-f", $ExposeSchemaSqlPath
  )
}
else {
  Write-Host "4/5 Omitido: grants para schema expuesto."
}

Write-Host "5/5 Verificando tablas y vistas..."
Run-PostgresTool -Step "Verificando tablas y vistas" -Arguments @(
  "psql",
  $targetDbUrl,
  "-v", "ON_ERROR_STOP=1",
  "-f", $VerifySqlPath
)

Write-Host "Migracion terminada."
