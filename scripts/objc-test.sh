#!/bin/bash

set -e

SCRIPTS=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(dirname $SCRIPTS)

export REACT_PACKAGER_LOG="$ROOT/server.log"

cd $ROOT

function cleanup {
  EXIT_CODE=$?
  set +e

  if [ $EXIT_CODE -ne 0 ];
  then
    WATCHMAN_LOGS=/usr/local/Cellar/watchman/3.1/var/run/watchman/$USER.log
    [ -f $WATCHMAN_LOGS ] && cat $WATCHMAN_LOGS

    [ -f $REACT_PACKAGER_LOG ] && cat $REACT_PACKAGER_LOG
  fi
}
trap cleanup EXIT

# TODO: We use xcodebuild because xctool would stall when collecting info about
# the tests before running them. Switch back when this issue with xctool has
# been resolved.
xcodebuild \
  -project Examples/UIExplorer/UIExplorer.xcodeproj \
  -scheme UIExplorer -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 5,OS=9.3' \
  test \
| xcpretty && exit ${PIPESTATUS[0]}
