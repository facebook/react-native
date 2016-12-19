#!/bin/sh

# Run from react-native root

set -e

if [ -z "$1" ]
  then
    echo "You must supply an OS version as the first arg, e.g. 8.1"
    exit 255
fi

xctool \
  -project Examples/UIExplorer/UIExplorer.xcodeproj \
  -scheme UIExplorer \
  -sdk iphonesimulator${1} \
  -destination "platform=iOS Simulator,OS=${1},name=iPhone 5" \
  build test
