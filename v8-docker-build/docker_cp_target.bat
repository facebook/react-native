@echo off
docker ps -alq > result.txt
set /p contid=<result.txt
del result.txt v8.zip
docker cp v8docker:/home/docker/v8/v8.zip ."
