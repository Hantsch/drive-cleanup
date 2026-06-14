# Drive Cleaner - one-step setup for Windows.
# Checks the Node.js version, installs dependencies, and prints next steps.

#requires -Version 5
$ErrorActionPreference = 'Stop'

Write-Host ''
Write-Host '  Drive Cleaner - setup' -ForegroundColor Green
Write-Host '  ----------------------'

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Host '  Node.js is not installed.' -ForegroundColor Red
  Write-Host '  Install the LTS release (v20 or newer) from https://nodejs.org/ and re-run this script.'
  exit 1
}

$version = (node --version)
$major = [int]($version.TrimStart('v').Split('.')[0])
Write-Host "  Node $version detected"
if ($major -lt 20) {
  Write-Host '  Node 20 or newer is required.' -ForegroundColor Red
  exit 1
}

Write-Host '  Installing dependencies (this can take a minute)...'
npm install

Write-Host ''
Write-Host '  Done.' -ForegroundColor Green
Write-Host '  Start the app in development mode with:  npm run dev'
Write-Host '  Build a production bundle with:          npm run build'
Write-Host ''
