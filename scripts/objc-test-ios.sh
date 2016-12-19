#!/bin/bash
set -ex

SCRIPTS=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(dirname $SCRIPTS)

cd $ROOT

XCODE_PROJECT="Examples/UIExplorer/UIExplorer.xcodeproj"
XCODE_SCHEME="UIExplorer"
XCODE_SDK="iphonesimulator"
if [ -z ${XCODE_DESTINATION+x} ]; then
  XCODE_DESTINATION="platform=iOS Simulator,name=iPhone 5s,OS=10.0"
fi

. ./scripts/objc-test.sh
