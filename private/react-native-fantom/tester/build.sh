#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -e

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
BUILD_DIR="$SCRIPT_DIR/build/debug"
REACT_NATIVE_ROOT_DIR=$(readlink -f "$SCRIPT_DIR/../../../packages/react-native")

while getopts ":r" opt; do
  case $opt in
    r) release_build=true ;;
    \?) ;;
  esac
done

if [ "$release_build" = true ]; then
  BUILD_DIR="$SCRIPT_DIR/build/release"
fi

cmake -S "$SCRIPT_DIR" -B "$BUILD_DIR" \
 -DREACT_ANDROID_DIR="${REACT_NATIVE_ROOT_DIR}/ReactAndroid" \
 -DFANTOM_THIRD_PARTY_DIR="${SCRIPT_DIR}/../build/third-party" \
 -DFANTOM_CODEGEN_DIR="${SCRIPT_DIR}/../build/codegen" \
 -DREACT_THIRD_PARTY_NDK_DIR="${REACT_NATIVE_ROOT_DIR}/ReactAndroid/build/third-party-ndk" \
 -DREACT_COMMON_DIR="${REACT_NATIVE_ROOT_DIR}/ReactCommon" \
 -DREACT_CXX_PLATFORM_DIR="${REACT_NATIVE_ROOT_DIR}/ReactCxxPlatform" \
 -DCMAKE_BUILD_TYPE="${release_build:+Release}${release_build:-Debug}"

cmake --build "$BUILD_DIR" --target fantom_tester
