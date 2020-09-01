param (
  [string]$processName
)

Get-Process -Name "$processName" | Stop-Process