:: Copyright (c) Meta Platforms, Inc. and affiliates.
::
:: This source code is licensed under the MIT license found in the
:: LICENSE file in the root directory of this source tree.

@echo off

setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0\
set BUILD_DIR=%SCRIPT_DIR%build
set REACT_NATIVE_ROOT_DIR=%SCRIPT_DIR%..\..\react-native

cmake -S "%SCRIPT_DIR%" -B "%BUILD_DIR%" -DREACT_COMMON_DIR="%REACT_NATIVE_ROOT_DIR%\ReactCommon"
cmake --build "%BUILD_DIR%" --target fantom_tester
