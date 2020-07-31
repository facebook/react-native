REM @if "%DEBUG%" == "" @echo off

REM Android tools doesn't support SDK/NDK paths containing space in it.
REM This scrip creates a symlink to Android NDK to work around the limitation.
REM We use the 

set ANDROID_NDK_SYMLINK_PATH=c:\android_ndk_symlink__

REM 1. Try ANDROID_NDK environment variable
set ANDROID_NDK_PATH=%ANDROID_NDK%

REM 2. May be SDK has ndk-bundle in it.
IF "%ANDROID_NDK_PATH%"=="" set ANDROID_NDK_PATH=%ANDROID_home%\ndk-bundle

echo %ANDROID_NDK_PATH%

if exist %ANDROID_NDK_PATH% (
    mklink /J %ANDROID_NDK_SYMLINK_PATH% "%ANDROID_NDK_PATH%"
    goto :success
) else (
    goto :error
)

:success
exit /b 0

:error
exit /b 1