@echo off
title Metro
call .packager.bat
cd "%PROJECT_ROOT%"
node "%REACT_NATIVE_PATH%/cli.js" start
pause
exit
