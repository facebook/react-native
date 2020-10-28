@if "%DEBUG%" == "" @echo off

REM Assuming the script is run from the root directory of a local clone of Microsoft fork of react-native. i.e. http:\\github.com\Microsoft\react-native

set BUILD_DEPS_DIR=build_deps

IF EXIST %BUILD_DEPS_DIR% (
    rmdir /s /q %BUILD_DEPS_DIR%
    if errorlevel 1 echo "Cleaning up the build dependency directory failed !" 1>&2
)

mkdir %BUILD_DEPS_DIR%

mkdir %BUILD_DEPS_DIR%\boost_1_68_0
mklink /D /J %BUILD_DEPS_DIR%\boost_1_68_0\boost ReactAndroid\packages\boost.1.68.0.0\lib\native\include\boost

REM When setting up locally, set the environement variable as follows.
REM set REACT_NATIVE_BOOST_PATH=%CD%\%BUILD_DEPS_DIR%