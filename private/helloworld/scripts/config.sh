#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -e

script_dir=$(dirname "$(readlink -f "$0")")

HELLOWORLD_PATH=$(realpath ../)
REACT_NATIVE_PATH=$(realpath ../../../packages/react-native)

sed -e "s|HELLOWORLD_PATH|$HELLOWORLD_PATH|g" -e "s|REACT_NATIVE_PATH|$REACT_NATIVE_PATH|g" "$script_dir/../.react-native.config"
