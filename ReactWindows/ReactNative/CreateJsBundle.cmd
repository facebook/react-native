@ECHO OFF
REM
REM Create the main.jsbundle from the JS assets.
REM This bundle will be included into the app package
REM 
REM Since the --root option of the react-native bundle
REM command crashes we need some tricks in here...
REM

SET ProjectJsDir=%~dp0.\Javascript\lib
SET ReactNativeJsDir=%~dp0.\Javascript\uwp-native

PUSHD %ProjectJsDir%

FOR /F "usebackq delims=" %%f IN (`DIR /B "%ReactNativeJsDir%\*.js"`) DO CALL :CheckFileExists %%f

FOR /F "usebackq delims=" %%f IN (`DIR /B "%ReactNativeJsDir%\*.js"`) DO CALL :CopyFiles %%f

CALL react-native bundle --out main.jsbundle --minify

FOR /F "usebackq delims=" %%f IN (`DIR /B "%ReactNativeJsDir%\*.js"`) DO CALL :DeleteFiles %%f
ECHO Done
POPD
GOTO :EOF


POPD

:CheckFileExists
SET File=%*
IF EXIST "%File%" ECHO #ERROR: File %ToFile% exists already! && SET FileOverwriteDetected=1
GOTO :EOF

:CopyFiles
SET FromFile=%ReactNativeJsDir%\%*
SET ToFile=%*
COPY "%FromFile%" "%ToFile%" > nul
GOTO :EOF

:DeleteFiles
SET File=%*
DEL "%File%"
GOTO :EOF
