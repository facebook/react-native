@if "%DEBUG%" == "" @echo off

REM Assuming the script is run from the root directory of a local clone of Microsoft fork of react-native. i.e. http:\\github.com\Microsoft\react-native

set BUILD_DEPS_DIR=build_deps

IF EXIST %BUILD_DEPS_DIR% (
    rmdir /s /q %BUILD_DEPS_DIR%
    if errorlevel 1 echo "Cleaning up the build dependency directory failed !" 1>&2
)

mkdir %BUILD_DEPS_DIR%

mkdir %BUILD_DEPS_DIR%\boost_1_63_0
mklink /D /J %BUILD_DEPS_DIR%\boost_1_63_0\boost ReactAndroid\packages\boost.1.68.0.0\lib\native\include\boost

mkdir %BUILD_DEPS_DIR%\double-conversion-1.1.6
mklink /D /J %BUILD_DEPS_DIR%\double-conversion-1.1.6\src double-conversion\double-conversion
mklink /D /J %BUILD_DEPS_DIR%\folly-2018.10.22.00 Folly\
mklink /D /J %BUILD_DEPS_DIR%\glog-0.3.5 glog

REM When setting up locally, set the environement variable as follows.
REM set REACT_NATIVE_DEPENDENCIES=%CD%\%BUILD_DEPS_DIR%