#!/bin/bash

# Execute command, and catch timeouts (CI has a 10 minute default timeout)
timeout 570 "$@"

# check status
STATUS=$?
if [ $STATUS == 0 ]; then
  echo "Command " "$@" " completed successfully"
else
  echo "Command " "$@" " exited with error status $STATUS"
fi
