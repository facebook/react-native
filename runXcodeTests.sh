#!/bin/bash
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
