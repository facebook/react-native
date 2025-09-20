#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This script should be run from the react-native root

export THIS_DIR
THIS_DIR="$(cd -P "$(dirname "$(realpath "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)"

if [ -f "scripts/.tests.env" ]; then
  # shellcheck source=scripts/.tests.env
  source "scripts/.tests.env"
fi

if [ -n "$1" ]
  then
    echo "Overriding..."
    IOS_TARGET_OS="${1}"
    SDK="iphonesimulator${1}"
    DESTINATION="platform=iOS Simulator,OS=${IOS_TARGET_OS},name=${IOS_DEVICE}"
fi

xcodebuild \
  -workspace "packages/rn-tester/RNTesterPods.xcworkspace" \
  -scheme "$SCHEME" \
  -sdk "$SDK" \
  -destination "$DESTINATION" \
  build test
