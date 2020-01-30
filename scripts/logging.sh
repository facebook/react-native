#!/bin/bash

function fullpath()
{
    [[ $1 = /* ]] && echo "$1" || echo "$PWD/${1#./}"
}

function now()
{
  date '+%Y-%m-%d %H:%M:%S'
}

THIS_FOLDER=$(dirname "$0")
THIS_FILE=$(basename "$0")
LOG_FILE="${THIS_FOLDER}/${THIS_FILE%.*}.log"
LOG_FILE="$(fullpath $LOG_FILE)"
PARENT_COMMAND=$(ps -o comm= $PPID)

function beginLog()
{
  echo "====================================================================" >> $LOG_FILE
  echo "$(now) ${THIS_FILE} launched by '${PARENT_COMMAND}' starting." >> $LOG_FILE
  echo >> $LOG_FILE
}

function endLog()
{
  echo >> $LOG_FILE
  echo "$(now) ${THIS_FILE} launched by '${PARENT_COMMAND}' ending." >> $LOG_FILE
}