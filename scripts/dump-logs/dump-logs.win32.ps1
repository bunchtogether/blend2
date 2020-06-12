# Run in powershell
# powershell.exe -ExecutionPolicy Bypass -File "C:\Program Files\Blend\cli\dump-logs.win32.ps1"
# rm .\dump-logs.win32.ps1; vim .\dump-logs.win32.ps1; powershell.exe -ExecutionPolicy Bypass -File .\dump-logs.win32.ps1

param($ARCHIVE_NAME)

$BLEND_INSTALLTION_DIR = "C:\Program Files\Blend"
$BLEND_LOGS_DIR = "$Env:APPDATA\blend\logs"
$LOGS_DIR_NAME_SUFFIX = [int64](get-date -uformat %s)
$LOGS_DIR_NAME = "$Env:temp\logs_$LOGS_DIR_NAME_SUFFIX"
$ZIP_ARCHIVE_NAME = "logs_$LOGS_DIR_NAME_SUFFIX.zip"

If ($ARCHIVE_NAME -ne $null) {
    $ZIP_ARCHIVE_NAME = $ARCHIVE_NAME
}
$ZIP_PATH = "$Env:temp\$ZIP_ARCHIVE_NAME"

Write-Host "$ARCHIVE_NAME $ZIP_ARCHIVE_NAME $ZIP_PATH $LOGS_DIR_NAME $LOGS_DIR_NAME_SUFFIX"

if (-not (Test-Path -LiteralPath $LOGS_DIR_NAME)) {
    New-Item -Path $LOGS_DIR_NAME -ItemType Directory
}

# Blend metadata
if (Test-Path -LiteralPath "$BLEND_INSTALLTION_DIR\VERSION" -PathType Leaf) {
    Copy-Item "$BLEND_INSTALLTION_DIR\VERSION" "$LOGS_DIR_NAME\VERSION"
}

# Blend logs
New-Item -Path "$LOGS_DIR_NAME/blend_logs" -ItemType Directory
Copy-Item "$BLEND_LOGS_DIR\blend*.log" "$LOGS_DIR_NAME\blend_logs"

# System logs
# Find a way to export them from event viewer

# Network Config
ipconfig /all > "$LOGS_DIR_NAME\network_interfaces"

# Open ports
Get-NetTCPConnection > "$LOGS_DIR_NAME\network_connections.log"

# Disk
Get-PSDrive > "$LOGS_DIR_NAME\disk.log"

# Process Info
Get-Process > "$LOGS_DIR_NAME\process.log"
Get-Process | Format-List * > "$LOGS_DIR_NAME\process_detailed.log"

# Archive logs
Compress-Archive -Path "$LOGS_DIR_NAME\*" -CompressionLevel Fastest -DestinationPath "$ZIP_PATH"

# Remove
Remove-Item -Path "$LOGS_DIR_NAME" -Recurse
Write-Host "FILENAME:$ZIP_PATH"