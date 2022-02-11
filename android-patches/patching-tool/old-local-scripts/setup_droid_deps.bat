@if "%DEBUG%" == "" @echo off

REM Assuming the script is run from the root directory of a local clone of Microsoft fork of react-native. i.e. http:\\github.com\Microsoft\react-native

REM repo where we apply the patches. It may not be Microsoft fork, hence the checked-in Folly, Glog, double-conversion projects may not exist in it.
set TARGET_FORK=E:\github\fb-rn-p

REM MS fork repo to refer to for the Folly, Glog, double-conversion etc.
set MS_FORK_WITH_DEPS=E:\github\ms-react-native-forpatch

set NUGET_EXE=E:\devtools\CredentialProviderBundle\NuGet.exe

pushd %TARGET_FORK%
set BUILD_DEPS_DIR=build_deps
IF EXIST %BUILD_DEPS_DIR% (
    rmdir /s /q %BUILD_DEPS_DIR%
    if errorlevel 1 echo "Cleaning up the build dependency directory failed !" 1>&2
)

set NUGET_PACKAGES_CONFIG=ReactAndroid\packages.config
IF EXIST %NUGET_PACKAGES_CONFIG% (
    %NUGET_EXE% restore %NUGET_PACKAGES_CONFIG% -PackagesDirectory ReactAndroid/packages -ConfigFile ReactAndroid/NuGet.Config
) else (
    echo "No nuget config found. No nuget packages are getting installed!" 1>&2
)

mkdir %BUILD_DEPS_DIR%
mklink /D /J %BUILD_DEPS_DIR%\boost ReactAndroid\packages\boost.1.68.0.0\lib\native\include\boost
mklink /D /J %BUILD_DEPS_DIR%\double-conversion %MS_FORK_WITH_DEPS%\double-conversion\double-conversion
mklink /D /J %BUILD_DEPS_DIR%\Folly %MS_FORK_WITH_DEPS%\Folly\
mklink /D /J %BUILD_DEPS_DIR%\glog %MS_FORK_WITH_DEPS%\glog

REM When setting up locally, set the environement variable as follows.
set REACT_NATIVE_DEPENDENCIES=%CD%\%BUILD_DEPS_DIR%

popd