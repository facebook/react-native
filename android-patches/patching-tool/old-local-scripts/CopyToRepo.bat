@if "%DEBUG%" == "" @echo off

set SOURCEDIR=%~dp0\..
set TARGETREPO=E:\github\ms-react-native-forpatch
set COPYDIST=1

REM Copy bundle
robocopy %SOURCEDIR%\bundle %TARGETREPO%\android-patches\bundle /S

REM Copy dist in case we need to debug from the repo.
IF '%COPYDIST%'=='1' (robocopy %SOURCEDIR%\dist %TARGETREPO%\android-patches\dist  /S)
else (rmdir /S /Q %TARGETREPO%\android-patches\dist)

REM Copy grouped patches.
robocopy %SOURCEDIR%\patches-droid-office-grouped %TARGETREPO%\android-patches\patches-droid-office-grouped /S

REM Copy enough stuff so that we can reproduce the work somewhere else.
robocopy %SOURCEDIR%\src %TARGETREPO%\android-patches\src /S
robocopy %SOURCEDIR% %TARGETREPO%\android-patches package.json
robocopy %SOURCEDIR% %TARGETREPO%\android-patches webpack.config.js
robocopy %SOURCEDIR% %TARGETREPO%\android-patches tsconfig.json
robocopy %SOURCEDIR% %TARGETREPO%\android-patches tslint.json
robocopy %SOURCEDIR% %TARGETREPO%\android-patches .prettierrc
robocopy %SOURCEDIR% %TARGETREPO%\android-patches .gitignore

REM Copy scripts.
robocopy %SOURCEDIR%\scripts %TARGETREPO%\android-patches\scripts /S
