:: Copyright (c) 2015-present, Facebook, Inc.
:: All rights reserved.
::
:: This source code is licensed under the BSD-style license found in the
:: LICENSE file in the root directory of this source tree. An additional grant
:: of patent rights can be found in the PATENTS file in the same directory.

@echo off
title React Packager
if "%PACKAGER_PORT%" == "" goto NOPORT
:YESPORT
node "%~dp0..\local-cli\cli.js" start --port "%PACKAGER_PORT%"
goto DONE
:NOPORT
node "%~dp0..\local-cli\cli.js" start
:DONE
pause
exit
