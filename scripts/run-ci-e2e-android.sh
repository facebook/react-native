#!/bin/bash

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

  rm $MARKER_ANDROID
  [ $SERVER_PID ] && kill -9 $SERVER_PID
  [ $APPIUM_PID ] && kill -9 $APPIUM_PID
  exit $EXIT_CODE
}
trap cleanup EXIT

# pack react-native into a .tgz file
./gradlew :ReactAndroid:installArchives -Pjobs=1
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

echo "Running an Android app"
npm install --save-dev appium@1.5.1 mocha@2.4.5 wd@0.3.11 colors@1.0.3
cp $SCRIPTS/android-e2e-test.js ./
cd android && ./gradlew :app:copyDownloadableDepsToLibs
# Make sure we installed local version of react-native
ls `basename $MARKER_ANDROID` > /dev/null
cd ..
./node_modules/react-native/packager/packager.sh --nonPersistent > /dev/null 2>&1 &
SERVER_PID=$!
node ./node_modules/.bin/appium > /dev/null 2>&1 &
APPIUM_PID=$!
cp ~/.android/debug.keystore android/keystores/debug.keystore
buck build android/app
sleep 20s
node node_modules/.bin/_mocha android-e2e-test.js

exit 0
