$BLEND_DIR = "$Env:ProgramFiles\Blend"

# Constants
$blendInboundTCPName = "Allow-Blend-TCP-In"
$blendInboundUDPName = "Allow-Blend-UDP-In"
$blendOutboundTCPName = "Allow-Blend-TCP-Out"
$blendOutboundUDPName = "Allow-Blend-UPD-Out"
$ffmpegInboundTCPName = "Allow-FFMpeg-TCP-In"
$ffmpegInboundUDPName = "Allow-FFMpeg-UDP-In"
$ffmpegOutboundTCPName = "Allow-FFMpeg-TCP-Out"
$ffmpegOutboundUDPName = "Allow-FFMpeg-UDP-Out"
$ffprobeInboundTCPName = "Allow-FFProbe-TCP-In"
$ffprobeInboundUDPName = "Allow-FFProbe-UDP-In"
$ffprobeOutboundTCPName = "Allow-FFProbe-TCP-Out"
$ffprobeOutboundUDPName = "Allow-FFProbe-UDP-Out"
$nodejsTCPInbound = "Node.js Server-side JavaScript"

# Create Blend Inbound rule
$blendInboundRuleExists = (Get-NetFirewallRule -DisplayName $blendInboundTCPName)
$blendOutboundRuleExists = (Get-NetFirewallRule -DisplayName $blendOutboundTCPName)
$ffmpegInboundRuleExists = (Get-NetFirewallRule -DisplayName $ffmpegInboundTCPName)
$ffmpegOutboundRuleExists = (Get-NetFirewallRule -DisplayName $ffmpegOutboundTCPName)
$ffprobeInboundRuleExists = (Get-NetFirewallRule -DisplayName $ffprobeInboundTCPName)
$ffprobeOutboundRuleExists = (Get-NetFirewallRule -DisplayName $ffprobeOutboundTCPName)
$nodejsTCPInboundExists = (Get-NetFirewallRule -DisplayName $nodejsTCPInbound)

if ($nodejsTCPInboundExists) {
  Set-NetFirewallRule -DisplayName $blendInboundTCPName -Enabled True -Direction Inbound -Protocol TCP -Action Allow -Protocol TCP -Profile Domain,Public,Private -Program "$BLEND_DIR\blend.exe"
} else {
  New-NetFirewallRule -Name "Node.js-Inbound-TCP" -Enabled True -Direction Inbound -Protocol TCP -Action Allow -Protocol TCP -Profile Domain,Public,Private -Program "$BLEND_DIR\blend.exe"
}

if ($blendInboundRuleExists) {
  Set-NetFirewallRule -DisplayName $blendInboundTCPName -Protocol TCP -Enabled True -Direction Inbound  -Profile Domain,Public,Private -Program "$BLEND_DIR\blend.exe" -Action Allow
  Set-NetFirewallRule -DisplayName $blendInboundUDPName -Protocol UDP -Enabled True -Direction Inbound -Profile Domain,Public,Private -Program "$BLEND_DIR\blend.exe" -Action Allow
} else {
  New-NetFirewallRule -DisplayName $blendInboundTCPName -Protocol TCP -Enabled True -Direction Inbound -Profile Domain,Public,Private -Program "$BLEND_DIR\blend.exe" -Action Allow
  New-NetFirewallRule -DisplayName $blendInboundUDPName -Protocol UDP -Enabled True -Direction Inbound  -Profile Domain,Public,Private -Program "$BLEND_DIR\blend.exe" -Action Allow
}

if ($blendOutboundRuleExists) {
  Set-NetFirewallRule -DisplayName $blendOutboundTCPName -Protocol TCP -Enabled True -Direction Outbound -Profile Domain,Public,Private -Program "$BLEND_DIR\blend.exe" -Action Allow
  Set-NetFirewallRule -DisplayName $blendOutboundUDPName -Protocol UDP -Enabled True -Direction Outbound -Profile Domain,Public,Private -Program "$BLEND_DIR\blend.exe" -Action Allow
} else {
  New-NetFirewallRule -DisplayName $blendOutboundTCPName -Protocol TCP -Enabled True -Direction Outbound -Profile Domain,Public,Private -Program "$BLEND_DIR\blend.exe" -Action Allow
  New-NetFirewallRule -DisplayName $blendOutboundUDPName -Protocol UDP -Enabled True -Direction Outbound -Profile Domain,Public,Private -Program "$BLEND_DIR\blend.exe" -Action Allow
}


if ($ffmpegInboundRuleExists) {
  Set-NetFirewallRule -DisplayName $ffmpegInboundTCPName -Protocol TCP -Enabled True -Direction Inbound -Profile Domain,Public,Private -Program "$BLEND_DIR\ffmpeg.exe" -Action Allow
  Set-NetFirewallRule -DisplayName $ffmpegInboundUDPName -Protocol UDP -Enabled True -Direction Inbound -Profile Domain,Public,Private -Program "$BLEND_DIR\ffmpeg.exe" -Action Allow
} else {
  New-NetFirewallRule -DisplayName $ffmpegInboundTCPName -Protocol TCP -Enabled True -Direction Inbound -Profile Domain,Public,Private -Program "$BLEND_DIR\ffmpeg.exe" -Action Allow
  New-NetFirewallRule -DisplayName $ffmpegInboundUDPName -Protocol UDP -Enabled True -Direction Inbound -Profile Domain,Public,Private -Program "$BLEND_DIR\ffmpeg.exe" -Action Allow
}

if ($ffmpegOutboundRuleExists) {
  Set-NetFirewallRule -DisplayName $ffmpegOutboundTCPName -Protocol TCP -Enabled True -Direction Outbound -Profile Domain,Public,Private -Program "$BLEND_DIR\ffmpeg.exe" -Action Allow
  Set-NetFirewallRule -DisplayName $ffmpegOutboundUDPName -Protocol UDP -Enabled True -Direction Outbound -Profile Domain,Public,Private -Program "$BLEND_DIR\ffmpeg.exe" -Action Allow
} else {
  New-NetFirewallRule -DisplayName $ffmpegOutboundTCPName -Protocol TCP -Enabled True -Direction Outbound -Profile Domain,Public,Private -Program "$BLEND_DIR\ffmpeg.exe" -Action Allow
  New-NetFirewallRule -DisplayName $ffmpegOutboundUDPName -Protocol UDP -Enabled True -Direction Outbound -Profile Domain,Public,Private -Program "$BLEND_DIR\ffmpeg.exe" -Action Allow
}

if ($ffprobeInboundRuleExists) {
  Set-NetFirewallRule -DisplayName $ffprobeInboundTCPName -Protocol TCP -Enabled True -Direction Inbound -Profile Domain,Public,Private -Program "$BLEND_DIR\ffprobe.exe" -Action Allow
  Set-NetFirewallRule -DisplayName $ffprobeInboundUDPName -Protocol UDP -Enabled True -Direction Inbound -Profile Domain,Public,Private -Program "$BLEND_DIR\ffprobe.exe" -Action Allow
} else {
  New-NetFirewallRule -DisplayName $ffprobeInboundTCPName -Protocol TCP -Enabled True -Direction Inbound -Profile Domain,Public,Private -Program "$BLEND_DIR\ffprobe.exe" -Action Allow
  New-NetFirewallRule -DisplayName $ffprobeInboundUDPName -Protocol UDP -Enabled True -Direction Inbound -Profile Domain,Public,Private -Program "$BLEND_DIR\ffprobe.exe" -Action Allow
}

if ($ffprobeOutboundRuleExists) {
  Set-NetFirewallRule -DisplayName $ffprobeOutboundTCPName -Protocol TCP -Enabled True -Direction Outbound -Profile Domain,Public,Private -Program "$BLEND_DIR\ffprobe.exe" -Action Allow
  Set-NetFirewallRule -DisplayName $ffprobeOutboundUDPName -Protocol UDP -Enabled True -Direction Outbound -Profile Domain,Public,Private -Program "$BLEND_DIR\ffprobe.exe" -Action Allow
} else {
  New-NetFirewallRule -DisplayName $ffprobeOutboundTCPName -Protocol TCP -Enabled True -Direction Outbound -Profile Domain,Public,Private -Program "$BLEND_DIR\ffprobe.exe" -Action Allow
  New-NetFirewallRule -DisplayName $ffprobeOutboundUDPName -Protocol UDP -Enabled True -Direction Outbound -Profile Domain,Public,Private -Program "$BLEND_DIR\ffprobe.exe" -Action Allow
}