$BLEND_DIR = "$Env:ProgramFiles\Blend"

# Constants
$blendInboundName = "Allow-Blend-In"
$blendOutboundName = "Allow-Blend-Out"
$ffmpegInboundName = "Allow-FFMpeg-In"
$ffmpegOutboundName = "Allow-FFMpeg-Out"
$ffprobeInboundName = "Allow-FFProbe-In"
$ffprobeOutboundName = "Allow-FFProbe-Out"
$nodeInboundName = "Allow-Blend-HTTP"

# Create Blend Inbound rule
$blendInboundRuleExists = (Get-NetFirewallRule -DisplayName $blendInboundName)
$blendOutboundRuleExists = (Get-NetFirewallRule -DisplayName $blendOutboundName)
$ffmpegInboundRuleExists = (Get-NetFirewallRule -DisplayName $ffmpegInboundName)
$ffmpegOutboundRuleExists = (Get-NetFirewallRule -DisplayName $ffmpegOutboundName)
$ffprobeInboundRuleExists = (Get-NetFirewallRule -DisplayName $ffprobeInboundName)
$ffprobeOutboundRuleExists = (Get-NetFirewallRule -DisplayName $ffprobeOutboundName)
$nodeInboundRuleExists = (Get-NetFirewallRule -DisplayName $nodeInboundName)

if ($nodeInboundRuleExists) {
  Set-NetFirewallRule -DisplayName $nodeInboundName -Enabled True -Direction Inbound  -Profile Domain,Public,Private -Program "$BLEND_DIR\blend.exe" -Action Allow -LocalPort 61340 -LocalAddress "127.0.0.1" -Protocol TCP -InterfaceType Any
} else {
  New-NetFirewallRule -DisplayName $nodeInboundName -Enabled True -Direction Inbound  -Profile Domain,Public,Private -Program "$BLEND_DIR\blend.exe" -Action Allow -LocalPort 61340 -LocalAddress "127.0.0.1" -Protocol TCP -InterfaceType Any
}

if ($blendInboundRuleExists) {
  Set-NetFirewallRule -DisplayName $blendInboundName -Enabled True -Direction Inbound  -Profile Domain,Public,Private -Program "$BLEND_DIR\blend.exe" -Action Allow
} else {
  New-NetFirewallRule -DisplayName $blendInboundName -Enabled True -Direction Inbound -Profile Domain,Public,Private -Program "$BLEND_DIR\blend.exe" -Action Allow
}

if ($blendOutboundRuleExists) {
  Set-NetFirewallRule -DisplayName $blendOutboundName -Enabled True -Direction Outbound -Profile Domain,Public,Private -Program "$BLEND_DIR\blend.exe" -Action Allow
} else {
  New-NetFirewallRule -DisplayName $blendOutboundName -Enabled True -Direction Outbound -Profile Domain,Public,Private -Program "$BLEND_DIR\blend.exe" -Action Allow
}


if ($ffmpegInboundRuleExists) {
  Set-NetFirewallRule -DisplayName $ffmpegInboundName -Enabled True -Direction Inbound -Profile Domain,Public,Private -Program "$BLEND_DIR\ffmpeg.exe" -Action Allow
} else {
  New-NetFirewallRule -DisplayName $ffmpegInboundName -Enabled True -Direction Inbound -Profile Domain,Public,Private -Program "$BLEND_DIR\ffmpeg.exe" -Action Allow
}

if ($ffmpegOutboundRuleExists) {
  Set-NetFirewallRule -DisplayName $ffmpegOutboundName -Enabled True -Direction Outbound -Profile Domain,Public,Private -Program "$BLEND_DIR\ffmpeg.exe" -Action Allow
} else {
  New-NetFirewallRule -DisplayName $ffmpegOutboundName -Enabled True -Direction Outbound -Profile Domain,Public,Private -Program "$BLEND_DIR\ffmpeg.exe" -Action Allow
}

if ($ffprobeInboundRuleExists) {
  Set-NetFirewallRule -DisplayName $ffprobeInboundName -Enabled True -Direction Inbound -Profile Domain,Public,Private -Program "$BLEND_DIR\ffprobe.exe" -Action Allow
} else {
  New-NetFirewallRule -DisplayName $ffprobeInboundName -Enabled True -Direction Inbound -Profile Domain,Public,Private -Program "$BLEND_DIR\ffprobe.exe" -Action Allow
}

if ($ffprobeOutboundRuleExists) {
  Set-NetFirewallRule -DisplayName $ffprobeOutboundName -Enabled True -Direction Outbound -Profile Domain,Public,Private -Program "$BLEND_DIR\ffprobe.exe" -Action Allow
} else {
  New-NetFirewallRule -DisplayName $ffprobeOutboundName -Enabled True -Direction Outbound -Profile Domain,Public,Private -Program "$BLEND_DIR\ffprobe.exe" -Action Allow
}