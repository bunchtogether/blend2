!include x64.nsh
!define Version "v1.0.0"

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
  File /r files\dist-www
  File files\*.node

  ${If} ${RunningX64}
    # Copy 64bit files
    File /r files\x64\*
  ${Else}
    # Copy 32bit files
    File /r files\x86\*
  ${EndIf}

  WriteRegStr HKEY_LOCAL_MACHINE "Software\Microsoft\Windows\CurrentVersion\Run" "Blend" "$InstallDir\blend.exe"
  AccessControl::GrantOnFile "$InstallDir" "(BU)" "FullAccess"
  AccessControl::GrantOnRegKey HKEY_LOCAL_MACHINE "$InstallDir" "(BU)" "FullAccess"
  ExecShell "" "$InstallDir\blend.exe"

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
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Blend"
  SetOutPath "$InstallDir\..\"
  RMDir /r $InstallDir
SectionEnd