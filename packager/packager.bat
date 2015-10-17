@if "%DEBUG%" == "" @echo off
set THIS_DIR=%~dp0
node %THIS_DIR%packager.js %*
