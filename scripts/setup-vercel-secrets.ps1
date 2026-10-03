# =============================================================================
#  setup-vercel-secrets.ps1
#  Configure VERSUS_WEBHOOK_SECRET et MERCHANT_CODE (et CORS_ORIGINS en option)
#  sur Vercel.
#
#  - Si une valeur est absente du .env local, elle est GENEREE puis ajoutee au
#    .env (fichier ignore par git) : c'est la que vous la retrouverez pour la
#    communiquer a Versus. Les secrets ne sont pas affiches dans la console.
#  - Les valeurs sont poussees sur Production et sur la branche Preview indiquee.
#  - Ce script NE redeploie PAS : fusionnez la branche ou lancez `vercel --prod`
#    ensuite (une variable n'est prise en compte que par les nouveaux deploiements).
#
#  Usage :
#    powershell -ExecutionPolicy Bypass -File scripts\setup-vercel-secrets.ps1
#    powershell -ExecutionPolicy Bypass -File scripts\setup-vercel-secrets.ps1 -PreviewBranch securite/durcissement-api -SkipProduction
#
#  Parametres :
#    -PreviewBranch   branche Preview a configurer (defaut : securite/durcissement-api)
#    -SkipProduction  ne touche pas a Production (utile pour tester l'apercu d'abord)
# =============================================================================
param(
  [string]$PreviewBranch = "securite/durcissement-api",
  [switch]$SkipProduction
)

Set-Location $PSScriptRoot\..

if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
  Write-Host "Installation de Vercel CLI..."
  npm i -g vercel
}
if (-not (Test-Path ".vercel\project.json")) { Write-Host "ERREUR: projet non lie (lancez 'vercel link')."; exit 1 }
if (-not (Test-Path ".env")) { New-Item -ItemType File ".env" | Out-Null }

# --- Lecture du .env (KEY=value) ---------------------------------------------
$envMap = @{}
Get-Content ".env" -Encoding UTF8 | ForEach-Object {
  if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
    $envMap[$matches[1]] = $matches[2].Trim().Trim('"')
  }
}

function New-RandomHex([int]$bytes) {
  $b = New-Object byte[] $bytes
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
  ($b | ForEach-Object { $_.ToString("x2") }) -join ""
}

# --- Generation des valeurs manquantes ----------------------------------------
$generated = @()
if ([string]::IsNullOrEmpty($envMap["VERSUS_WEBHOOK_SECRET"])) {
  $envMap["VERSUS_WEBHOOK_SECRET"] = New-RandomHex 32
  $generated += "VERSUS_WEBHOOK_SECRET"
}
if ([string]::IsNullOrEmpty($envMap["MERCHANT_CODE"])) {
  $envMap["MERCHANT_CODE"] = New-RandomHex 8   # 16 caracteres, facile a saisir
  $generated += "MERCHANT_CODE"
}
foreach ($name in $generated) {
  Add-Content ".env" -Encoding UTF8 -Value "$name=$($envMap[$name])"
  Write-Host "Genere et ajoute a .env : $name"
}

$names = @("VERSUS_WEBHOOK_SECRET", "MERCHANT_CODE")
if (-not [string]::IsNullOrEmpty($envMap["CORS_ORIGINS"])) { $names += "CORS_ORIGINS" }

# --- Poussee sur Vercel -------------------------------------------------------
function Push-Var([string]$name, [string]$value, [string]$target, [string]$branch) {
  $vargs = @($name, $target)
  if ($branch) { $vargs += $branch }
  try { vercel env rm @args -y 2>$null | Out-Null } catch {}   # retire l'ancienne valeur si presente
  $value | vercel env add @args | Out-Null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "OK $name -> $target$(if ($branch) { " ($branch)" }) (longueur $($value.Length))"
  } else {
    Write-Host "ECHEC $name -> $target$(if ($branch) { " ($branch)" })"
  }
}

foreach ($name in $names) {
  $val = $envMap[$name]
  if (-not $SkipProduction) { Push-Var $name $val "production" "" }
  Push-Var $name $val "preview" $PreviewBranch
}

Write-Host ""
Write-Host "Termine. Prochaines etapes :"
Write-Host " 1. Communiquer VERSUS_WEBHOOK_SECRET (dans .env) a Versus pour https://papeterie.vercel.app/api/webhooks/versus"
Write-Host "    en-tete 'x-versus-signature' ou 'Authorization: Bearer <secret>'."
Write-Host " 2. Donner MERCHANT_CODE (dans .env) au marchand pour /gestion."
Write-Host " 3. Redeployer : fusionner la branche, ou 'vercel --prod' (Production), pour que les variables s'appliquent."
