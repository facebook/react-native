#!/bin/bash

set -e

SCRIPTS=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(dirname $SCRIPTS)

cd $ROOT

function cleanup {
  EXIT_CODE=$?
  set +e

  if [ $EXIT_CODE -ne 0 ];
  then
    WATCHMAN_LOGS=/usr/local/Cellar/watchman/3.1/var/run/watchman/$USER.log
    [ -f $WATCHMAN_LOGS ] && cat $WATCHMAN_LOGS
  fi
}
trap cleanup EXIT

if [ -z "$XCODE_DESTINATION" ]; then
  XCODE_DESTINATION="platform=iOS Simulator,name=iPhone 5,OS=9.3"
fi

# Support for environments without xcpretty installed
set +e
OUTPUT_TOOL=$(which xcpretty)
set -e
if [ -z "$OUTPUT_TOOL" ]; then
  OUTPUT_TOOL="sed"
fi

# TODO: We use xcodebuild because xctool would stall when collecting info about
# the tests before running them. Switch back when this issue with xctool has
# been resolved.
xcodebuild \
  -project Examples/UIExplorer/UIExplorer.xcodeproj \
  -scheme UIExplorer \
  -sdk iphonesimulator \
  -destination "$XCODE_DESTINATION" \
  test \
  | $OUTPUT_TOOL && exit ${PIPESTATUS[0]}
