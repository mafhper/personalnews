; hooks.nsh - PersonalNews installer hooks
; Encoding: ASCII-safe para compatibilidade com NSIS/ANSI em Windows/CI.

!macro NSIS_HOOK_POSTINSTALL
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "Deseja criar um atalho na area de trabalho para ${PRODUCTNAME}?" \
    IDNO skip_shortcut
  CreateShortcut "$DESKTOP\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
  skip_shortcut:
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  Delete "$DESKTOP\${PRODUCTNAME}.lnk"
!macroend

