#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -e

script_dir=$(dirname "$(readlink -f "$0")")

node -p "JSON.stringify(require(\"$script_dir/react-native.config.js\"), null, 2)"
