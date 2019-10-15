

# Remove-Item -Recurse .\node_modules
Remove-Item -Recurse .\package\windows\files\x64\*
Remove-Item -Recurse .\package\windows\files\x86\*
Remove-Item -Recurse .\package\windows\files\dist-www

$path = "./installers"
If(!(test-path $path)) { New-Item -ItemType Directory -Force -Path $path }

Add-Type -assembly "system.io.compression.filesystem"

$VERSION = $(Get-Content .\package.json | Out-String | ConvertFrom-JSON).version

# Build exes
&".\node_modules\.bin\pkg.cmd" . --targets node10-win32-x64 --options trace-warnings --out-path .\package\windows\files\x64\
&".\node_modules\.bin\pkg.cmd" . --targets node10-win32-x86 --options trace-warnings --out-path .\package\windows\files\x86\

cp -r .\dist-www .\package\windows\files\dist-www

# Copy ffmpeg, ffprobe binaries
# 64 bit
cp .\node_modules\@bunchtogether\ffmpeg-static\bin\win32\x64\ffmpeg.exe .\package\windows\files\x64\ffmpeg.exe
cp .\node_modules\@bunchtogether\ffmpeg-static\bin\win32\x64\ffprobe.exe .\package\windows\files\x64\ffprobe.exe
cp .\package\windows\x64\* .\package\windows\files\x64

# 32 bit
cp .\node_modules\@bunchtogether\ffmpeg-static\bin\win32\x32\ffmpeg.exe .\package\windows\files\x86\ffmpeg.exe
cp .\node_modules\@bunchtogether\ffmpeg-static\bin\win32\x32\ffprobe.exe .\package\windows\files\x86\ffprobe.exe
cp .\package\windows\x86\* .\package\windows\files\x86

# Copy sample.mp4 and band.png
cp .\src\sample.mp4 .\package\windows\files\sample.mp4
cp .\src\band.png .\package\windows\files\band.png
cp .\src\icon.ico .\package\windows\files\icon.ico

# Build installer
&'C:\Program Files (x86)\NSIS\Bin\makensis.exe' .\package\windows\installer.nsi
Remove-Item .\installers\blend-installer-x64-86-$VERSION.exe -ErrorAction Ignore
move .\package\windows\blend-installer.exe .\installers\blend-installer-x64-86-$VERSION.exe

# pause