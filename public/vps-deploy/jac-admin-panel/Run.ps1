Set-Location -Path $PSScriptRoot
$host.UI.RawUI.WindowTitle = "Justachat IRC Admin Console v7"
if (Get-Command py -ErrorAction SilentlyContinue) { py .\main.py }
elseif (Get-Command python -ErrorAction SilentlyContinue) { python .\main.py }
else { Write-Host "Python not found. Install from python.org (check 'Add to PATH')." -ForegroundColor Red; Pause }
