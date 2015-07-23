#!/usr/bin/env bash

# Copyright (c) 2015-present, Facebook, Inc.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree. An additional grant
# of patent rights can be found in the PATENTS file in the same directory.

if [ $REACT_PACKAGER_LOG ];
then
  echo "Logs will be redirected to $REACT_PACKAGER_LOG"
  exec &> $REACT_PACKAGER_LOG
fi

ulimit -n 4096

THIS_DIR=$(dirname "$0")
node "$THIS_DIR/packager.js" "$@"
