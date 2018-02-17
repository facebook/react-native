#!/usr/bin/env bash

# Copyright (c) 2015-present, Facebook, Inc.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Set terminal title
echo -en "\033]0;Web Socket Test Server\a"
clear

THIS_DIR=$(dirname "$0")
pushd "$THIS_DIR"
./websocket_integration_test_server.js
popd

echo "Process terminated. Press <enter> to close the window"
read
