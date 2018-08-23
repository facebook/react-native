#!/bin/bash

# execute command
"$@"

# check status
STATUS=$?
if [ $STATUS == 0 ]; then
  echo "Command " "$@" " completed successfully"
else
  echo "Command " "$@" " exited with error status $STATUS"
fi
