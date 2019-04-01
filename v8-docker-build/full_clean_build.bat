@echo on
call "clear_docker.bat"
call "docker_build.bat"
docker run -d --name v8docker v8_docker:latest
call "docker_cp_target.bat"