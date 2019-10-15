!include x64.nsh
!define Version "v2.2.10"
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

  # Copy Files
  File files\sample.mp4
  File files\band.png
  File files\icon.ico
  File /r files\dist-www

  ${If} ${RunningX64}
    # Copy 64bit files
    File /r files\x64\*
  ${Else}
    # Copy 32bit files
    File /r files\x86\*
  ${EndIf}

  SetShellVarContext "all"
  ReadRegStr $R0 ${ENV_HKLM} "BAND_KIOSK_MODE"
  FileOpen $4 "$PROFILE\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\blend.cmd" a
  # FileWrite $4 'echo @off$\r$\nset BLEND_RUNTIME_DIR=$InstallDir$\r$\ncd "$InstallDir"$\r$\nSTART /b /min "" "blend-runtime.exe"'
  # FileWrite $4 'echo @off$\r$\nset BLEND_RUNTIME_DIR=$InstallDir$\r$\nset KIOSK_MODE=$BAND_KIOSK_MODE$\r$\ncd "$InstallDir"$\r$\nPowershell.exe -command "Start-Process -FilePath $\'$InstallDir\blend-runtime.exe$\' -WorkingDirectory $\'$InstallDir$\' -WindowStyle Hidden"'
  FileWrite $4 'echo @off$\r$\nPowershell.exe -command "Start-Process -FilePath $\'$InstallDir\blend-runtime.exe$\' -WorkingDirectory $\'$InstallDir$\' -WindowStyle Hidden"'
  FileClose $4
  AccessControl::GrantOnFile "$InstallDir" "(BU)" "FullAccess"
  ExecShell "" "$PROFILE\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\blend.cmd"

  # Startup Menu entry
  CreateShortCut "$PROFILE\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Blend.lnk" "$PROFILE\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\blend.cmd" "" "$InstallDir\icon.ico"

  writeUninstaller "$InstallDir\Uninstaller.exe"

  # Exit after installation is finished
  Quit
SectionEnd


# Uninstaller
Function un.onInit
	SetShellVarContext all
	StrCpy $InstallDir "$PROGRAMFILES\Blend"
	#Verify the uninstaller - last chance to back out
	MessageBox MB_OKCANCEL "Permanantly remove Blend ?" IDOK next
		Abort
	next:
	!insertmacro VerifyUserIsAdmin
FunctionEnd

Section "uninstall"
  ExecWait "TaskKill /IM blend-runtime.exe /F"
  ExecWait "TaskKill /IM blend.exe /F"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Blend"
  SetOutPath "$InstallDir\..\"
  RMDir /r $InstallDir
  Delete "$PROFILE\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\blend.cmd"
  Delete "$PROFILE\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Blend.lnk"
SectionEnd