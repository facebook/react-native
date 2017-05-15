#!/bin/sh

# Run from react-native root

set -e

if [ -z "$1" ]
  then
    echo "You must supply an OS version as the first arg, e.g. 8.1"
    exit 255
fi

xctool \
  -project RNTester/RNTester.xcodeproj \
  -scheme RNTester \
  -sdk iphonesimulator${1} \
  -destination "platform=iOS Simulator,OS=${1},name=iPhone 5" \
  build test
