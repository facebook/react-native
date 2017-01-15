#!/bin/bash

set -ex

# set default environment variables
ROOT=$(pwd)
SCRIPTS=$(pwd)/scripts

RUN_ANDROID=0
RUN_CLI_INSTALL=1
RUN_IOS=0
RUN_JS=0

ANDROID_NPM_DEPS="appium@1.5.1 mocha@2.4.5 wd@0.3.11 colors@1.0.3 pretty-data2@0.40.1"
CLI_PACKAGE=$ROOT/react-native-cli/react-native-cli-*.tgz
PACKAGE=$ROOT/react-native-*.tgz
REACT_NATIVE_MAX_WORKERS=1

# parse command line args & flags
while :; do
  case "$1" in
    --android)
      RUN_ANDROID=1
      shift
      ;;

    --ios)
      RUN_IOS=1
      shift
      ;;

    --js)
      RUN_JS=1
      shift
      ;;

    --skip-cli-install)
      RUN_CLI_INSTALL=0
      shift
      ;;

    --tvos)
      RUN_IOS=1
      shift
      ;;

    *)
      break
  esac
done

if [ $RUN_ANDROID -eq 0 ] && [ $RUN_IOS -eq 0 ] && [ $RUN_JS -eq 0 ]; then
  echo "No e2e tests specified!"
  exit 0
fi

# create temp dir
TEMP_DIR=$(mktemp -d /tmp/react-native-XXXXXXXX)

# To make sure we actually installed the local version
# of react-native, we will create a temp file inside the template
# and check that it exists after `react-native init
IOS_MARKER=$(mktemp $ROOT/local-cli/templates/HelloWorld/ios/HelloWorld/XXXXXXXX)
ANDROID_MARKER=$(mktemp ${ROOT}/local-cli/templates/HelloWorld/android/XXXXXXXX)

# install CLI
cd react-native-cli
npm pack
cd ..

# can skip cli install for non sudo mode
if [ $RUN_CLI_INSTALL -ne 0 ]; then
  npm install -g $CLI_PACKAGE
  if [ $? -ne 0 ]; then
    echo "Could not install react-native-cli globally, please run in su mode"
    echo "Or with --skip-cli-install to skip this step"
    exit 1
  fi
fi

if [ $RUN_ANDROID -ne 0 ]; then
    set +ex

    AVD_UUID=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 8 | head -n 1)

    # create virtual device
    echo no | android create avd -n $AVD_UUID -f -t android-19 --abi default/armeabi-v7a

    # emulator setup
    emulator64-arm -avd $AVD_UUID -no-skin -no-audio -no-window -no-boot-anim &
    bootanim=""
    until [[ "$bootanim" =~ "stopped" ]]; do
        sleep 5
        bootanim=$(adb -e shell getprop init.svc.bootanim 2>&1)
        echo "boot animation status=$bootanim"
    done
    set -ex

  ./gradlew :ReactAndroid:installArchives -Pjobs=1 -Dorg.gradle.jvmargs="-Xmx512m -XX:+HeapDumpOnOutOfMemoryError"
  if [ $? -ne 0 ]; then
    echo "Failed to compile Android binaries"
    exit 1
  fi
fi

npm pack
if [ $? -ne 0 ]; then
  echo "Failed to pack react-native"
  exit 1
fi

cd $TEMP_DIR

react-native init EndToEndTest --version $PACKAGE --npm
if [ $? -ne 0 ]; then
  echo "Failed to execute react-native init"
  echo "Most common reason is npm registry connectivity, try again"
  exit 1
fi

cd EndToEndTest

# android tests
if [ $RUN_ANDROID -ne 0 ]; then
  echo "Running an Android e2e test"
  echo "Installing e2e framework"

  npm install --save-dev $ANDROID_NPM_DEPS --silent >> /dev/null
  if [ $? -ne 0 ]; then
    echo "Failed to install appium"
    echo "Most common reason is npm registry connectivity, try again"
    exit 1
  fi

  cp $SCRIPTS/android-e2e-test.js android-e2e-test.js

  cd android
  echo "Downloading Maven deps"
  ./gradlew :app:copyDownloadableDepsToLibs

  cd ..
  keytool -genkey -v -keystore android/keystores/debug.keystore -storepass android -alias androiddebugkey -keypass android -dname "CN=Android Debug,O=Android,C=US"

  echo "Starting packager server"
  node ./node_modules/.bin/appium >> /dev/null &
  APPIUM_PID=$!
  echo "Starting appium server $APPIUM_PID"

  echo "Building app"
  buck build android/app

  # hack to get node unhung (kill buckd)
  kill -9 $(pgrep java)

  if [ $? -ne 0 ]; then
    echo "could not execute Buck build, is it installed and in PATH?"
    exit 1
  fi

  npm start >> /dev/null &
  SERVER_PID=$!
  sleep 15

  echo "Executing android e2e test"
  node node_modules/.bin/_mocha android-e2e-test.js
  if [ $? -ne 0 ]; then
    echo "Failed to run Android e2e tests"
    echo "Most likely the code is broken"
    exit 1
  fi

  # kill packager process
  if kill -0 $SERVER_PID; then
    echo "Killing packager $SERVER_PID"
    kill -9 $SERVER_PID
  fi

  # kill appium process
  if kill -0 $APPIUM_PID; then
    echo "Killing appium $APPIUM_PID"
    kill -9 $APPIUM_PID
  fi

fi

# ios tests
if [ $RUN_IOS -ne 0 ]; then
  echo "Running ios e2e tests not yet implemented for docker!"
fi

# js tests
if [ $RUN_JS -ne 0 ]; then
  # Check the packager produces a bundle (doesn't throw an error)
  REACT_NATIVE_MAX_WORKERS=1 react-native bundle --platform android --dev true --entry-file index.android.js --bundle-output android-bundle.js
  if [ $? -ne 0 ]; then
    echo "Could not build android bundle"
    exit 1
  fi

  REACT_NATIVE_MAX_WORKERS=1 react-native bundle --platform ios --dev true --entry-file index.ios.js --bundle-output ios-bundle.js
  if [ $? -ne 0 ]; then
    echo "Could not build iOS bundle"
    exit 1
  fi
fi

# directory cleanup
rm $IOS_MARKER
rm $ANDROID_MARKER

exit 0
