#!/bin/bash

set -ex

SCRIPTS=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(dirname $SCRIPTS)

cd $ROOT

XCODE_PROJECT="Examples/UIExplorer/UIExplorer.xcodeproj"
XCODE_SCHEME="UIExplorer-tvOS"
XCODE_SDK="appletvsimulator"
if [ -z ${XCODE_DESTINATION+x} ]; then
  XCODE_DESTINATION="platform=tvOS Simulator,name=Apple TV 1080p,OS=10.0"
fi

. ./scripts/objc-test.sh
