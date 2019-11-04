
$BLEND_DIR = "$PROGRAMFILES\Blend"
New-NetFirewallRule -Name "Allow-Blend" -DisplayName "Allow Blend" -Direction Inbound -Program "$BLEND_DIR\blend.exe" -Action Allow
New-NetFirewallRule -Name "Allow-Blend" -DisplayName "Allow Blend" -Direction Outbound -Program "$BLEND_DIR\blend.exe" -Action Allow
New-NetFirewallRule -Name "Allow-Blend-FFMpeg" -DisplayName "Allow Blend-FFMpeg" -Direction Inbound -Program "$BLEND_DIR\ffmpeg.exe" -Action Allow
New-NetFirewallRule -Name "Allow-Blend-FFMpeg" -DisplayName "Allow Blend-FFMpeg" -Direction Outbound -Program "$BLEND_DIR\ffmpeg.exe" -Action Allow
New-NetFirewallRule -Name "Allow-Blend-FFProbe" -DisplayName "Allow Blend-FFProbe" -Direction Inbound -Program "$BLEND_DIR\ffprobe.exe" -Action Allow
New-NetFirewallRule -Name "Allow-Blend-FFProbe" -DisplayName "Allow Blend-FFProbe" -Direction Outbound -Program "$BLEND_DIR\ffprobe.exe" -Action Allow