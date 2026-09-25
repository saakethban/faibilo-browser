!include nsDialogs.nsh
!include LogicLib.nsh

!ifndef BUILD_UNINSTALLER

Var WelcomeDialog
Var WelcomeTitle
Var WelcomeSubtitle
Var DevHeaderLabel
Var DevBodyLabel
Var WelcomeDiscordBtn
Var IsAlreadyInstalled
Var InstallStatusText
Var TipLabelHwnd
Var TipBtnHwnd
Var TitleFont
Var BoldFont
Var NormalFont

!macro customWelcomePage
  Page custom FaibiloWelcomePage FaibiloWelcomePageLeave
!macroend

Function FaibiloWelcomePage
  ; Hide legacy wizard headers and dividing lines for a clean, modern aesthetic
  GetDlgItem $0 $HWNDPARENT 1034 ; Header title
  ShowWindow $0 ${SW_HIDE}
  GetDlgItem $0 $HWNDPARENT 1036 ; Header subtitle
  ShowWindow $0 ${SW_HIDE}
  GetDlgItem $0 $HWNDPARENT 1037 ; Header icon
  ShowWindow $0 ${SW_HIDE}
  GetDlgItem $0 $HWNDPARENT 1038 ; Header white background
  ShowWindow $0 ${SW_HIDE}
  GetDlgItem $0 $HWNDPARENT 1035 ; Divider line
  ShowWindow $0 ${SW_HIDE}
  GetDlgItem $0 $HWNDPARENT 1028 ; Branding text
  ShowWindow $0 ${SW_HIDE}
  GetDlgItem $0 $HWNDPARENT 3    ; Back button
  ShowWindow $0 ${SW_HIDE}

  ; Customize primary button label
  GetDlgItem $0 $HWNDPARENT 1
  SendMessage $0 ${WM_SETTEXT} 0 "STR:Install Now >"

  nsDialogs::Create 1018
  Pop $WelcomeDialog
  ${If} $WelcomeDialog == error
    Abort
  ${EndIf}

  ; Silently check in background if Faibilo is already installed
  StrCpy $IsAlreadyInstalled "0"
  ${If} ${FileExists} "$LOCALAPPDATA\Programs\Faibilo\Faibilo.exe"
    StrCpy $IsAlreadyInstalled "1"
  ${Else}
    ReadRegStr $0 HKCU "Software\Clients\StartMenuInternet\Faibilo" ""
    ${If} $0 != ""
      StrCpy $IsAlreadyInstalled "1"
    ${EndIf}
  ${EndIf}

  ${If} $IsAlreadyInstalled == "1"
    StrCpy $InstallStatusText "Updating Faibilo to the latest version..."
  ${Else}
    StrCpy $InstallStatusText "Installing Faibilo on your device..."
  ${EndIf}

  ; Create fonts
  ${If} $TitleFont == 0
    CreateFont $TitleFont "Segoe UI" "16" "700"
  ${EndIf}
  ${If} $BoldFont == 0
    CreateFont $BoldFont "Segoe UI" "9" "700"
  ${EndIf}
  ${If} $NormalFont == 0
    CreateFont $NormalFont "Segoe UI" "9" "400"
  ${EndIf}

  ; Title
  ${NSD_CreateLabel} 10u 8u 280u 18u "Welcome to Faibilo"
  Pop $WelcomeTitle
  SendMessage $WelcomeTitle ${WM_SETFONT} $TitleFont 1

  ; Subtitle
  ${NSD_CreateLabel} 10u 28u 280u 14u "A fast, modern, privacy-first web browser designed for you."
  Pop $WelcomeSubtitle
  SendMessage $WelcomeSubtitle ${WM_SETFONT} $NormalFont 1

  ; Developer message header
  ${NSD_CreateLabel} 10u 52u 280u 12u "Message from the Developer:"
  Pop $DevHeaderLabel
  SendMessage $DevHeaderLabel ${WM_SETFONT} $BoldFont 1

  ; Developer message body
  ${NSD_CreateLabel} 10u 66u 280u 30u "I am an independent solo developer building Faibilo from scratch. If you discover bugs, have ideas, or want to suggest new features, join our Discord community:"
  Pop $DevBodyLabel
  SendMessage $DevBodyLabel ${WM_SETFONT} $NormalFont 1

  ; Discord button
  ${NSD_CreateButton} 10u 100u 125u 18u "Join Discord Community"
  Pop $WelcomeDiscordBtn
  SendMessage $WelcomeDiscordBtn ${WM_SETFONT} $BoldFont 1
  ${NSD_OnClick} $WelcomeDiscordBtn OnWelcomeDiscordClick

  nsDialogs::Show
FunctionEnd

Function OnWelcomeDiscordClick
  ExecShell "open" "https://discord.gg/YRhcgEGVjN"
FunctionEnd

Function FaibiloWelcomePageLeave
  ; Proceed to installation
FunctionEnd

!macro customInstallMode
  StrCpy $isForceCurrentInstall "1"
!macroend

!macro customPageAfterChangeDir
  !define MUI_PAGE_CUSTOMFUNCTION_SHOW instFilesShow
!macroend

Function instFilesShow
  FindWindow $0 "#32770" "" $HWNDPARENT
  ${If} $0 != 0
    ; Update standard status text control (ID 1006)
    GetDlgItem $1 $0 1006
    ${If} $1 != 0
      ${If} $InstallStatusText != ""
        SendMessage $1 ${WM_SETTEXT} 0 "STR:$InstallStatusText"
      ${EndIf}
    ${EndIf}

    ; Create tips static text control
    System::Call 'user32::CreateWindowEx(i 0, t "STATIC", t "Developer message: I am a single developer behind this browser, so report any bugs in this Discord server:", i 0x50000000, i 20, i 105, i 410, i 36, p $0, i 3001, p 0, p 0) p .r2'
    StrCpy $TipLabelHwnd $2

    ; Create Discord button
    System::Call 'user32::CreateWindowEx(i 0, t "BUTTON", t "Join Discord Server", i 0x50010000, i 20, i 145, i 140, i 26, p $0, i 3002, p 0, p 0) p .r3'
    StrCpy $TipBtnHwnd $3

    ; Apply GUI font
    SendMessage $HWNDPARENT ${WM_GETFONT} 0 0 $4
    ${If} $4 != 0
      SendMessage $TipLabelHwnd ${WM_SETFONT} $4 1
      SendMessage $TipBtnHwnd ${WM_SETFONT} $4 1
    ${EndIf}

    ; Run tip rotator
    InitPluginsDir
    File /oname=$PLUGINSDIR\rotate_tips.ps1 "${PROJECT_DIR}\build\rotate_tips.ps1"
    ExecShell "" "powershell.exe" "-ExecutionPolicy Bypass -WindowStyle Hidden -File $\"$PLUGINSDIR\rotate_tips.ps1$\" -Hwnd $TipLabelHwnd -BtnHwnd $TipBtnHwnd"
  ${EndIf}
FunctionEnd

!macro customFinishPage
  Function AutoLaunchFinish
    ${if} ${isUpdated}
      StrCpy $1 "--updated"
    ${else}
      StrCpy $1 ""
    ${endif}
    ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" "$1"
    Quit
  FunctionEnd

  Page custom AutoLaunchFinish
!macroend

!endif ; !ifndef BUILD_UNINSTALLER

!macro customInstall
  DetailPrint "Registering Faibilo Browser capabilities..."
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Faibilo" "" "Faibilo"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Faibilo" "LocalizedString" "Faibilo"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Faibilo\DefaultIcon" "" "$INSTDIR\Faibilo.exe,0"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Faibilo\shell\open\command" "" '"$INSTDIR\Faibilo.exe"'
  
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Faibilo\Capabilities" "ApplicationDescription" "Faibilo - Fast, sleek, privacy-focused modern web browser"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Faibilo\Capabilities" "ApplicationIcon" "$INSTDIR\Faibilo.exe,0"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Faibilo\Capabilities" "ApplicationName" "Faibilo"

  ; File Associations capabilities
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Faibilo\Capabilities\FileAssociations" ".htm" "FaibiloHTML"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Faibilo\Capabilities\FileAssociations" ".html" "FaibiloHTML"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Faibilo\Capabilities\FileAssociations" ".shtml" "FaibiloHTML"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Faibilo\Capabilities\FileAssociations" ".xhtml" "FaibiloHTML"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Faibilo\Capabilities\FileAssociations" ".xht" "FaibiloHTML"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Faibilo\Capabilities\FileAssociations" ".mhtml" "FaibiloHTML"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Faibilo\Capabilities\FileAssociations" ".svg" "FaibiloHTML"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Faibilo\Capabilities\FileAssociations" ".pdf" "FaibiloPDF"

  ; URL Associations capabilities
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Faibilo\Capabilities\URLAssociations" "http" "FaibiloHTTP"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Faibilo\Capabilities\URLAssociations" "https" "FaibiloHTTPS"
  WriteRegStr HKCU "Software\Clients\StartMenuInternet\Faibilo\Capabilities\URLAssociations" "faibilo" "FaibiloInternal"

  ; Register in Windows RegisteredApplications list
  WriteRegStr HKCU "Software\RegisteredApplications" "Faibilo" "Software\Clients\StartMenuInternet\Faibilo\Capabilities"

  ; Register Open With handlers in Windows Explorer
  WriteRegStr HKCU "Software\Classes\Applications\Faibilo.exe" "FriendlyAppName" "Faibilo"
  WriteRegStr HKCU "Software\Classes\Applications\Faibilo.exe\SupportedTypes" ".html" ""
  WriteRegStr HKCU "Software\Classes\Applications\Faibilo.exe\SupportedTypes" ".htm" ""
  WriteRegStr HKCU "Software\Classes\Applications\Faibilo.exe\SupportedTypes" ".xhtml" ""
  WriteRegStr HKCU "Software\Classes\Applications\Faibilo.exe\SupportedTypes" ".mhtml" ""
  WriteRegStr HKCU "Software\Classes\Applications\Faibilo.exe\SupportedTypes" ".svg" ""
  WriteRegStr HKCU "Software\Classes\Applications\Faibilo.exe\SupportedTypes" ".pdf" ""
  WriteRegStr HKCU "Software\Classes\Applications\Faibilo.exe\shell\open\command" "" '"$INSTDIR\Faibilo.exe" "%1"'
!macroend

!macro customUnInstall
  DeleteRegKey HKCU "Software\Clients\StartMenuInternet\Faibilo"
  DeleteRegValue HKCU "Software\RegisteredApplications" "Faibilo"
  DeleteRegKey HKCU "Software\Classes\Applications\Faibilo.exe"
!macroend
