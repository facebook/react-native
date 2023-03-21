#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -x

hermesc_dir_path="$1"

CMAKE_BINARY=${CMAKE_BINARY:-$(command -v cmake | tr -d '\n')}

if ! "$CMAKE_BINARY" -S . -B "$hermesc_dir_path"
then
    echo "Failed to configure Hermesc cmake project."
    exit 1
fi
if ! "$CMAKE_BINARY" --build "$hermesc_dir_path" --target hermesc -j "$(sysctl -n hw.ncpu)"
then
    echo "Failed to build Hermesc cmake project."
    exit 1
fi
