@rem disable all output if DEBUG env variable is not set
@if "%DEBUG%" == "" @echo off
@rem set THIS_DIR variable to the full directory path
set THIS_DIR=%~dp0
node %THIS_DIR%packager.js %*
