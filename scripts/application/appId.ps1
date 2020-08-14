param (
  [string]$name
)

Function Get-Application-Id {
    $command = "Get-StartApps -name '$name'"

    Invoke-Expression $command
}

Get-Application-Id | ConvertTo-Json 
