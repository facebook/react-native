echo Removing stopped containers
FOR /f "tokens=*" %%i IN ('docker ps -a -q') DO docker rm %%i

echo Now removing the images.
FOR /f "tokens=*" %%i IN ('docker images -f "dangling=true" -q') DO docker rmi %%i
