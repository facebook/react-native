#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# execute command
"$@"

# check status
STATUS=$?
if [ $STATUS == 0 ]; then
  echo "Command " "$@" " completed successfully"
else
  echo "Command " "$@" " exited with error status $STATUS"
fi
