#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -x -e

hermesc_dir_path="$1"; shift
jsi_path="$1"


# VisionOS support has been added to CMake from version 3.28.0 onwards. Error out if the version is lower.
function check_cmake_version {
  required_version="3.28.0"
  cmake_version=$($CMAKE_BINARY --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -n 1)

  if ! printf "%s\n%s\n" "$required_version" "$cmake_version" | sort -V | head -n 1 | grep -q "$required_version"; then
    echo "error: CMake version $required_version or higher is required. Found: $cmake_version"
    exit 1
  fi
}

check_cmake_version


# This script is supposed to be executed from Xcode "run script" phase.
# Xcode sets up its build environment based on the build target (iphone, iphonesimulator, macodsx).
# We want to make sure that hermesc is built for mac.
# So we clean the environment with env -i, and explicitly set SDKROOT to macosx
SDKROOT=$(xcode-select -p)/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk
env -i SDKROOT="$SDKROOT" "$CMAKE_BINARY" -S "${PODS_ROOT}/hermes-engine" -B "$hermesc_dir_path" -DJSI_DIR="$jsi_path"
env -i SDKROOT="$SDKROOT" "$CMAKE_BINARY" --build "$hermesc_dir_path" --target hermesc -j "$(sysctl -n hw.ncpu)"
