$BLEND_DIR = "$Env:ProgramFiles\Blend"

# Constants
$blendInboundName = "Allow-Blend (In)"
$blendOutboundName = "Allow-Blend (Out)"
$ffmpegInboundName = "Allow-FFMpeg (In)"
$ffmpegOutboundName = "Allow-FFMpeg (Out)"
$ffprobeInboundName = "Allow-FFProbe (In)"
$ffprobeOutboundName = "Allow-FFProbe (Out)"

# Create Blend Inbound rule
$blendInboundRuleExists = (Get-NetFirewallRule -DisplayName $blendInboundName)
$blendOutboundRuleExists = (Get-NetFirewallRule -DisplayName $blendOutboundName)
$ffmpegInboundRuleExists = (Get-NetFirewallRule -DisplayName $ffmpegInboundName)
$ffmpegOutboundRuleExists = (Get-NetFirewallRule -DisplayName $ffmpegOutboundName)
$ffprobeInboundRuleExists = (Get-NetFirewallRule -DisplayName $ffprobeInboundName)
$ffprobeOutboundRuleExists = (Get-NetFirewallRule -DisplayName $ffprobeOutboundName)

if ($blendInboundRuleExists) {
  Set-NetFirewallRule -DisplayName $blendInboundName -Enabled True
} else {
  New-NetFirewallRule -DisplayName $blendInboundName -Direction Inbound -Program "$BLEND_DIR\blend.exe" -Action Allow
}

if ($blendOutboundRuleExists) {
  Set-NetFirewallRule -DisplayName $blendOutboundName -Enabled True
} else {
  New-NetFirewallRule -DisplayName $blendOutboundName -Direction Outbound -Program "$BLEND_DIR\blend.exe" -Action Allow
}


if ($ffmpegInboundRuleExists) {
  Set-NetFirewallRule -DisplayName $ffmpegInboundName -Enabled True
} else {
  New-NetFirewallRule -DisplayName $ffmpegInboundName -Direction Inbound -Program "$BLEND_DIR\ffmpeg.exe" -Action Allow
}

if ($ffmpegOutboundRuleExists) {
  Set-NetFirewallRule -DisplayName $ffmpegOutboundName -Enabled True
} else {
  New-NetFirewallRule -DisplayName $ffmpegOutboundName -Direction Outbound -Program "$BLEND_DIR\ffmpeg.exe" -Action Allow
}

if ($ffprobeInboundRuleExists) {
  Set-NetFirewallRule -DisplayName $ffprobeInboundName -Enabled True
} else {
  New-NetFirewallRule -DisplayName $ffprobeInboundName -Direction Inbound -Program "$BLEND_DIR\ffprobe.exe" -Action Allow
}

if ($ffprobeOutboundRuleExists) {
  Set-NetFirewallRule -DisplayName $ffprobeOutboundName -Enabled True
} else {
  New-NetFirewallRule -DisplayName $ffprobeOutboundName -Direction Outbound -Program "$BLEND_DIR\ffprobe.exe" -Action Allow
}