!include x64.nsh
!include LogicLib.nsh
!define Version "v2.2.23"
!define ENV_HKLM 'HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment"'

Name "Blend Installer"
Outfile "blend-installer.exe"

Var /global InstallDir
Var /global AppDataDir

!macro VerifyUserIsAdmin
UserInfo::GetAccountType
pop $0
${If} $0 != "admin"
        messageBox mb_iconstop "Administrator rights required!"
        setErrorLevel 740
        quit
${EndIf}
!macroend

# Installer
Function .onInit
	setShellVarContext all
	StrCpy $InstallDir "$PROGRAMFILES\Blend"
  StrCpy $AppDataDir "$APPDATA"
	!insertmacro VerifyUserIsAdmin
FunctionEnd

Section "install"

  ExecWait "TaskKill /IM blend-runtime.exe /F"
  ExecWait "TaskKill /IM blend.exe /F"
  ExecWait "TaskKill /IM ffmpeg.exe /F"
  ExecWait "TaskKill /IM ffprobe.exe /F"
  ExecWait "TaskKill /IM tray_windows_release.exe /F"


  ; Remove prev. $InstallDir instead of uninstall
  ; Overwrite previous install
  SetOutPath "$InstallDir\..\"
  RMDir /r $InstallDir
  Delete "$PROFILE\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\blend.cmd"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Blend"


  ;; Reference: https://nsis.sourceforge.io/Auto-uninstall_old_before_installing_new
  ; IfFileExists "$InstallDir\Uninstaller.exe" 0 +3
  ; ExecWait '"$InstallDir\Uninstaller.exe" /S _?=$InstallDir'
  ; RMDir "$InstallDir"

  CreateDirectory "$InstallDir"
  SetOutPath "$InstallDir"

  # File /r generate-cert.ps1
  # File /r pfx-to-pem.ps1
  # ExecWait "powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File $InstallDir\generate-cert.ps1"

  CreateDirectory "$APPDATA\blend"
  AccessControl::GrantOnFile "$APPDATA\blend" "(BU)" "FullAccess"

  # Copy Files
  File files\sample.mp4
  File files\band.png
  File files\blend.ico
  File /r files\dist-www
  File /r files\dist-startup-www
  File /r files\static
  File /r files\scripts

  ${If} ${RunningX64}
    # Copy 64bit files
    SetRegView 64
    File /r files\x64\*
  ${Else}
    # Copy 32bit files
    SetRegView 32
    File /r files\x86\*
  ${EndIf}

  SetShellVarContext "all"
  # Add or Remove Program Reg Key
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Blend" "DisplayName" Blend
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Blend" "DisplayVersion" ${Version}
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Blend" "InstallLocation" $InstallDir

  ReadRegStr $R0 ${ENV_HKLM} "BAND_KIOSK_MODE"
  ; Delete previous files
  Delete "$PROFILE\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\Blend.cmd"

  FileOpen $4 "$InstallDir\Launch.cmd" a
  FileWrite $4 'echo @off$\r$\n$\"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe$\" -command "Start-Process -FilePath $\'$InstallDir\blend-runtime.exe$\' -WorkingDirectory $\'$InstallDir$\' -WindowStyle Hidden"'
  FileClose $4
  AccessControl::GrantOnFile "$InstallDir" "(S-1-5-32-545)" "FullAccess"

  # Startup Menu entry
  CreateShortCut "$AppDataDir\Microsoft\Windows\Start Menu\Programs\Blend.lnk" "$InstallDir\Launch.cmd" "" "$InstallDir\blend.ico"

  ; Autostart
  WriteRegStr HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Run" "Blend" "$\"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe$\" -command Start-Process -FilePath '$InstallDir\blend-runtime.exe' -WorkingDirectory '$InstallDir' -WindowStyle Hidden"

  ; Add Firewall exceptions
  ; blend-runtime, blend, ffmpeg, ffprobe
  ExpandEnvStrings $0 "%COMSPEC%"
  File /r firewall.ps1
  ExecWait "powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File  $\"$InstallDir\firewall.ps1$\""
  Delete "$InstallDir\firewall.ps1"

  ExecWait 'netsh advfirewall firewall add rule name=$\"Allow-Blend-HTTP$\" action=allow program=$\"$InstallDir\blend.exe$\" enable=yes Localip=$\"127.0.0.1$\" Localport=61340 protocol=tcp interfacetype=any profile=domain,private,public dir=in'

  writeUninstaller "$InstallDir\Uninstaller.exe"

  ExecShell "" "$InstallDir\Launch.cmd"

  # Exit after installation is finished
  Quit

SectionEnd


# Uninstaller
Function un.onInit
	SetShellVarContext all
	StrCpy $InstallDir "$PROGRAMFILES\Blend"
  StrCpy $AppDataDir "$APPDATA"
  ${If} ${RunningX64}
    SetRegView 64
  ${Else}
    SetRegView 32
  ${EndIf}
	!insertmacro VerifyUserIsAdmin
FunctionEnd

Section "uninstall"
  ExecWait "TaskKill /IM blend-runtime.exe /F"
  ExecWait "TaskKill /IM blend.exe /F"
  ExecWait "TaskKill /IM ffmpeg.exe /F"
  ExecWait "TaskKill /IM ffprobe.exe /F"
  ExecWait "TaskKill /IM tray_windows_release.exe /F"

  ; Remove firewall rules
  ; ExecWait "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File $InstallDir\firewall.ps1 -Action UNINSTALL"
  ExecWait "powershell -ExecutionPolicy Bypass -WindowStyle Hidden -Command Remove-NetFirewallRule -DisplayName 'Allow-Blend-In'"
  ExecWait "powershell -ExecutionPolicy Bypass -WindowStyle Hidden -Command Remove-NetFirewallRule -DisplayName 'Allow-Blend-Out'"
  ExecWait "powershell -ExecutionPolicy Bypass -WindowStyle Hidden -Command Remove-NetFirewallRule -DisplayName 'Allow-FFMpeg-In'"
  ExecWait "powershell -ExecutionPolicy Bypass -WindowStyle Hidden -Command Remove-NetFirewallRule -DisplayName 'Allow-FFMpeg-Out'"
  ExecWait "powershell -ExecutionPolicy Bypass -WindowStyle Hidden -Command Remove-NetFirewallRule -DisplayName 'Allow-FFProbe-In'"
  ExecWait "powershell -ExecutionPolicy Bypass -WindowStyle Hidden -Command Remove-NetFirewallRule -DisplayName 'Allow-FFProbe-Out'"
  ExecWait "powershell -ExecutionPolicy Bypass -WindowStyle Hidden -Command Remove-NetFirewallRule -DisplayName 'Allow-Blend-HTTP'"

  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Blend"
  DeleteRegValue HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Run" "Blend"
  SetOutPath "$InstallDir\..\"
  RMDir /r $InstallDir
  Delete "$AppDataDir\Microsoft\Windows\Start Menu\Programs\Blend.lnk"
SectionEnd
