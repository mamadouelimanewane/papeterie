# =============================================================================
#  setup-vercel-versus.ps1
#  Configure les variables d'environnement Versus sur Vercel (Production)
#  en recopiant les valeurs EXACTES depuis le fichier .env local.
#
#  But : eviter toute erreur de saisie manuelle (espaces, guillemets, typo)
#        dans le dashboard Vercel.
#
#  Prerequis :
#    - Etre dans le dossier du projet (contient .env et .vercel)
#    - .env contient VERSUS_LOGIN / VERSUS_PASSWORD / VERSUS_BASE_URL
#
#  Usage :
#    powershell -ExecutionPolicy Bypass -File scripts\setup-vercel-versus.ps1
#
#  Apres regeneration des identifiants chez Versus Fintech :
#    1. Mettre a jour les valeurs dans .env
#    2. Relancer ce script  ->  il repousse et redeploie automatiquement
# =============================================================================

Set-Location $PSScriptRoot\..

# 1) Vercel CLI dispo ?
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
  Write-Host "Installation de Vercel CLI..."
  npm i -g vercel
}

# 2) Lire les valeurs depuis .env (format KEY=value)
if (-not (Test-Path ".env")) { Write-Host "ERREUR: .env introuvable."; exit 1 }
$envMap = @{}
Get-Content ".env" -Encoding UTF8 | ForEach-Object {
  if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
    $envMap[$matches[1]] = $matches[2].Trim().Trim('"')
  }
}

# 3) (Re)pousser chaque variable sur Production
foreach ($name in @("VERSUS_LOGIN","VERSUS_PASSWORD","VERSUS_BASE_URL")) {
  $val = $envMap[$name]
  if ([string]::IsNullOrEmpty($val)) { Write-Host "AVERTISSEMENT: $name absent de .env"; continue }
  try { vercel env rm $name production -y 2>$null } catch {}   # retire l'ancienne si presente
  $val | vercel env add $name production                       # ajoute la valeur exacte
  Write-Host "OK $name configure (longueur $($val.Length))"
}

# 4) Redeployer en production (avec les nouvelles variables)
vercel --prod
