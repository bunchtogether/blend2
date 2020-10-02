$properties = New-Object -TypeName psobject

function Get-StartMenuApplicationProperties{
    param (
        [string]$path
    )
    $Shortcuts = Get-ChildItem -Recurse $path -Include *.lnk
    $Shell = New-Object -ComObject WScript.Shell
    
    foreach ($Shortcut in $Shortcuts)
    {
        $ShortcutName = $Shortcut.Name;
        $IconName = $ShortcutName.Substring(0,$ShortcutName.Length-4)
        $Path = $Shell.CreateShortcut($Shortcut).targetpath
        If ($IconName  -eq 'Google Chrome')  {
            continue
        }
        $properties | Add-Member -Name $IconName -Type NoteProperty -Value $Path
    }
}

Get-StartMenuApplicationProperties "C:\ProgramData\Microsoft\Windows\Start Menu\Programs"
Get-StartMenuApplicationProperties "C:\Users\$env:username\AppData\Roaming\Microsoft\Windows\Start Menu\Programs"
$properties | ConvertTo-Json