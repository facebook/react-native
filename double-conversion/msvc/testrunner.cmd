@echo off
setlocal enabledelayedexpansion
setlocal enableextensions

for /f useback %%f in (`Release\x64\run_tests.exe --list`) do (
	set var=%%f
	if "x!var:~-1!" == "x<" (
		set 	var=!var:~0,-1!
	)
	Release\x64\run_tests !var!
)
