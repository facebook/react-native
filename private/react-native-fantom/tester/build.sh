#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

set -e

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
BUILD_DIR="$SCRIPT_DIR/build"
REACT_NATIVE_ROOT_DIR=$(readlink -f "$SCRIPT_DIR/../../../packages/react-native")

cmake -S "$SCRIPT_DIR" -B "$BUILD_DIR" \
 -DREACT_ANDROID_DIR="${REACT_NATIVE_ROOT_DIR}/ReactAndroid" \
 -DFANTOM_THIRD_PARTY_DIR="${SCRIPT_DIR}/../build/third-party" \
 -DREACT_THIRD_PARTY_NDK_DIR="${REACT_NATIVE_ROOT_DIR}/ReactAndroid/build/third-party-ndk" \
 -DREACT_COMMON_DIR="${REACT_NATIVE_ROOT_DIR}/ReactCommon"

cmake --build "$BUILD_DIR" --target fantom_tester

while getopts ":r" opt; do
  case $opt in
    r) execute_tester=true ;;
    \?) ;;
  esac
done

for arg in "$@"; do
  if [ "$arg" = "--featureFlags" ]; then
    feature_flags="--featureFlags=${@:$OPTIND:1}"
    break
  fi
done

if [ "$execute_tester" = true ]; then
  if [ -n "$feature_flags" ]; then
    "$BUILD_DIR/fantom_tester" "$feature_flags"
  else
    "$BUILD_DIR/fantom_tester"
  fi
fi
