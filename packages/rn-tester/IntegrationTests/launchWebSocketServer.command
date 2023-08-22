#!/bin/bash

# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# [macOS] Keep this file around to help Azure Pipelines run the Websocket integration test

# Set terminal title
echo -en "\033]0;Web Socket Test Server\a"
clear

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
pushd "$THIS_DIR"
./websocket_integration_test_server.js
popd

echo "Process terminated. Press <enter> to close the window"
read
