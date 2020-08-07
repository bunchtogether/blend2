param (
  [string]$appID
)

Function Launch-Application {
    $command = "explorer shell:Appsfolder\'$appID'"

    Invoke-Expression $command
}

Launch-Application