function Create-TempDirectory {
    $TempDir = [System.IO.Path]::GetTempPath()
    $path = "$TempDir\blend-application-icons"
    If(!(test-path $path))
    {
      New-Item -ItemType Directory -Force -Path $path
    }      
}

function Get-StartMenuIcons{
    param (
        [string]$path
    )
    $TempDir = [System.IO.Path]::GetTempPath()
    $Shortcuts = Get-ChildItem -Recurse $path -Include *.lnk
    $Shell = New-Object -ComObject WScript.Shell
    foreach ($Shortcut in $Shortcuts)
    {
        $ShortcutName = $Shortcut.Name;
        $IconName = $ShortcutName.Substring(0,$ShortcutName.Length-4)
        $Path = $Shell.CreateShortcut($Shortcut).targetpath
        $Icon = [System.Drawing.Icon]::ExtractAssociatedIcon($Path)
        $Icon.ToBitmap().Save("$TempDir\blend-application-icons\$IconName.png", [System.Drawing.Imaging.ImageFormat]::Png)
    }
}

Add-Type -AssemblyName System.Drawing
Create-TempDirectory 
Get-StartMenuIcons "C:\ProgramData\Microsoft\Windows\Start Menu\Programs"
Get-StartMenuIcons "C:\Users\$env:username\AppData\Roaming\Microsoft\Windows\Start Menu\Programs"