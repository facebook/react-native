#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -x -e

hermesc_dir_path="$1"; shift
jsi_path="$1"

# This script is supposed to be executed from Xcode "run script" phase.
# Xcode sets up its build environment based on the build target (iphone, iphonesimulator, macosx).
# We want to make sure that hermesc is built for mac.
# So we clean the environment with env -i, and explicitly set SDKROOT to macosx
SDKROOT=$(xcode-select -p)/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk

env -i \
  PATH="$PATH" \
  SDKROOT="$SDKROOT" \
  "$CMAKE_BINARY" -S "${PODS_ROOT}/hermes-engine" -B "$hermesc_dir_path" -DJSI_DIR="$jsi_path"

env -i \
  PATH="$PATH" \
  SDKROOT="$SDKROOT" \
  "$CMAKE_BINARY" --build "$hermesc_dir_path" --target hermesc -j "$(sysctl -n hw.ncpu)"
