param (
  [string]$processName
)

$stopped

do {
  $running = Get-Process "$processName" -ErrorAction SilentlyContinue
  if ($running) {
    Start-Sleep -s 1
  } else {
    $stopped = 'true'
    break
  }
} while (1 -eq 1)

$stopped