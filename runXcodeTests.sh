#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
#
# This script should be run from the react-native root

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)
source "scripts/.tests.env"

if [ -n "$1" ]
  then
    echo "Overriding..."
    IOS_TARGET_OS="${1}"
    SDK="iphonesimulator${1}"
    DESTINATION="platform=iOS Simulator,OS=${IOS_TARGET_OS},name=${IOS_DEVICE}"
fi

xcodebuild \
  -project "RNTester/RNTester.xcodeproj" \
  -scheme $SCHEME \
  -sdk $SDK \
  -destination "$DESTINATION" \
  build test
