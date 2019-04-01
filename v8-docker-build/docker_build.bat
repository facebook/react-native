@echo on
echo %DATE%
echo %TIME%
SET LOGTIME=%TIME: =0%
echo %LOGTIME%
docker build . -t v8_docker --build-arg  CACHEBUST=%LOGTIME%
