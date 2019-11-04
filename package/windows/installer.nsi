!include x64.nsh
!define Version "v2.2.12"
!define ENV_HKLM 'HKLM "SYSTEM\CurrentControlSet\Control\Session Manager\Environment"'

Name "Blend Installer"
Outfile "blend-installer.exe"

Var /global InstallDir

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
	!insertmacro VerifyUserIsAdmin
FunctionEnd

Section "install"

  ExecWait "TaskKill /IM blend-runtime.exe /F"
  ExecWait "TaskKill /IM blend.exe /F"

  CreateDirectory "$InstallDir"
  SetOutPath "$InstallDir"

  # File /r generate-cert.ps1
  # File /r pfx-to-pem.ps1
  # ExecWait "powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File $InstallDir\generate-cert.ps1"

  # Add or Remove reg key
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Blend" "DisplayName" Blend
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Blend" "DisplayVersion" ${Version}
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Blend" "InstallLocation" $InstallDir


  ; Add Firewall exceptions
  ; blend-runtime, blend, ffmpeg, ffprobe
  ExpandEnvStrings $0 "%COMSPEC%"
  ExecWait "powershell -ExecutionPolicy Bypass -WindowStyle Hidden New-NetFirewallRule -DisplayName “Allow Blend” -Direction Inbound -Program $InstallDir\blend.exe -Action Allow"
  ExecWait "powershell -ExecutionPolicy Bypass -WindowStyle Hidden New-NetFirewallRule -DisplayName “Allow Blend” -Direction Outbound -Program $InstallDir\blend.exe -Action Allow"
  ExecWait "powershell -ExecutionPolicy Bypass -WindowStyle Hidden New-NetFirewallRule -DisplayName “Allow Blend-FFMpeg” -Direction Inbound -Program $InstallDir\ffmpeg.exe -Action Allow"
  ExecWait "powershell -ExecutionPolicy Bypass -WindowStyle Hidden New-NetFirewallRule -DisplayName “Allow Blend-FFMpeg” -Direction Outbound -Program $InstallDir\ffmpeg.exe -Action Allow"
  ExecWait "powershell -ExecutionPolicy Bypass -WindowStyle Hidden New-NetFirewallRule -DisplayName “Allow Blend-FFProbe” -Direction Inbound -Program $InstallDir\ffprobe.exe -Action Allow"
  ExecWait "powershell -ExecutionPolicy Bypass -WindowStyle Hidden New-NetFirewallRule -DisplayName “Allow Blend-FFProbe” -Direction Outbound -Program $InstallDir\ffprobe.exe -Action Allow"

  # Copy Files
  File files\sample.mp4
  File files\band.png
  File files\blend.ico
  File /r files\dist-www
  File /r files\static
  File /r files\scripts

  ${If} ${RunningX64}
    # Copy 64bit files
    File /r files\x64\*
  ${Else}
    # Copy 32bit files
    File /r files\x86\*
  ${EndIf}

  SetShellVarContext "all"
  ReadRegStr $R0 ${ENV_HKLM} "BAND_KIOSK_MODE"
  ; Delete previous files
  Delete "$PROFILE\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\Blend.cmd"

  FileOpen $4 "$InstallDir\Launch.cmd" a
  FileWrite $4 'echo @off$\r$\nPowershell.exe -command "Start-Process -FilePath $\'$InstallDir\blend-runtime.exe$\' -WorkingDirectory $\'$InstallDir$\' -WindowStyle Hidden"'
  FileClose $4
  AccessControl::GrantOnFile "$InstallDir" "(BU)" "FullAccess"
  ExecShell "" "$InstallDir\Launch.cmd"

  # Startup Menu entry
  CreateShortCut "$PROFILE\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Blend.lnk" "$InstallDir\Launch.cmd" "" "$InstallDir\blend.ico"

  ; Autostart
  WriteRegStr HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Run" "Blend" "Powershell.exe -command $\"Start-Process -FilePath $\'$InstallDir\blend-runtime.exe$\' -WorkingDirectory $\'$InstallDir$\' -WindowStyle Hidden$\""

  writeUninstaller "$InstallDir\Uninstaller.exe"

  # Exit after installation is finished
  Quit
SectionEnd


# Uninstaller
Function un.onInit
	SetShellVarContext all
	StrCpy $InstallDir "$PROGRAMFILES\Blend"
	!insertmacro VerifyUserIsAdmin
FunctionEnd

Section "uninstall"
  ExecWait "TaskKill /IM blend-runtime.exe /F"
  ExecWait "TaskKill /IM blend.exe /F"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Blend"
  DeleteRegKey HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Run\Blend"
  SetOutPath "$InstallDir\..\"
  RMDir /r $InstallDir
  Delete "$PROFILE\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Blend.lnk"
SectionEnd