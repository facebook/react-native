#!/bin/bash

# The script has one required argument:
# --packager: react-native init, make sure the packager starts
# --ios: react-native init, start the packager and run the iOS app
# --android: same but run the Android app

# Abort the mission if any command fails
set -e
set -x

if [ -z $1 ]; then
  echo "Please run the script with --ios, --android or --packager" >&2
  exit 1
fi

SCRIPTS=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(dirname $SCRIPTS)
TEMP=$(mktemp -d /tmp/react-native-XXXXXXXX)

# When tests run on CI server, we won't be able to see logs
# from packager because it runs in a separate window. This is
# a simple workaround, see packager/packager.sh
export REACT_PACKAGER_LOG="$TEMP/server.log"

# To make sure we actually installed the local version
# of react-native, we will create a temp file inside the template
# and check that it exists after `react-native init`
MARKER_IOS=$(mktemp $ROOT/local-cli/generator-ios/templates/app/XXXXXXXX)
MARKER_ANDROID=$(mktemp $ROOT/local-cli/generator-android/templates/src/XXXXXXXX)

function cleanup {
  EXIT_CODE=$?
  set +e

  if [ $EXIT_CODE -ne 0 ];
  then
    WATCHMAN_LOGS=/usr/local/Cellar/watchman/3.1/var/run/watchman/$USER.log
    [ -f $WATCHMAN_LOGS ] && cat $WATCHMAN_LOGS

    [ -f $REACT_PACKAGER_LOG ] && cat $REACT_PACKAGER_LOG
  fi

  rm $MARKER_IOS
  rm $MARKER_ANDROID
  [ $SERVER_PID ] && kill -9 $SERVER_PID
}
trap cleanup EXIT

# pack react-native into a .tgz file
npm pack
PACKAGE=$(pwd)/react-native-*.tgz

# get react-native-cli dependencies
cd react-native-cli
npm pack
CLI_PACKAGE=$(pwd)/react-native-cli-*.tgz

cd $TEMP

npm install -g $CLI_PACKAGE
react-native init EndToEndTest --version $PACKAGE
cd EndToEndTest

case $1 in
"--packager"*)
  echo "Running a basic packager test"
  # Check the packager produces a bundle (doesn't throw an error)
  react-native bundle --platform android --dev true --entry-file index.android.js --bundle-output android-bundle.js
  # TODO do flow check
  ;;
"--ios"*)
  echo "Running an iOS app"
  cd ios
  # Make sure we installed local version of react-native
  ls EndToEndTest/`basename $MARKER_IOS` > /dev/null
  ../node_modules/react-native/packager/packager.sh --nonPersistent &
  SERVER_PID=$!
  # Start the app on the simulator
  xctool -scheme EndToEndTest -sdk iphonesimulator test
  ;;
"--android"*)
  echo "Running an Android app"
  cd android
  # Make sure we installed local version of react-native
  ls `basename $MARKER_ANDROID` > /dev/null
  ../node_modules/react-native/packager/packager.sh --nonPersistent &
  SERVER_PID=$!
  # TODO Start the app and check it renders "Welcome to React Native"
  echo "The Android e2e test is not implemented yet" >&2
  exit 1
  ;;
*)
  echo "Please run the script with --ios, --android or --packager" >&2
  exit 1
  ;;
esac
