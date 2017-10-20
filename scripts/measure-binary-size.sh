#!/usr/bin/env bash
set -e

# This script helps measure the binary size of an app with React Native.
# It will ask for the React Native version and other options and then
# create a new React Native project, assemble a release build and print
# out the outputs dir which has the binary.
# Right now it only supports Android is very much a WIP.


# Prerequisites

: "${ANDROID_HOME?Need to set \$ANDROID_HOME. For help see: http://stackoverflow.com/a/19986294/62}"
command -v yarn >/dev/null 2>&1 || { echo >&2 'I require yarn but it''s not installed. Install with `brew update && brew install yarn`. Careful: this installs `node` via brew; if you use `nvm` you may have to delete that `node` install. Aborting.'; exit 1; }
command -v npm >/dev/null 2>&1 || { echo >&2 "I require npm but it's not installed.  Aborting."; exit 1; }
npm list -g react-native-cli >/dev/null 2>&1 || { echo >&2 'I require react-native-cli but it''s not installed. Install with `npm install -g react-native-cli`. Aborting.'; exit 1; }

# Select version

echo "Enter React Native version from https://facebook.github.io/react-native/versions.html. Note that you'll probably have to add the patch version e.g. 0.42.0 instead of 0.42"
read rn_version

# Init app

read -p "Enable proguard? " yn
case $yn in
    [Yy]* ) ENABLE_PROGUARD=1; PROGUARD_SUFFIX=Enabled;;
    [Nn]* ) ENABLE_PROGUARD=0; PROGUARD_SUFFIX=Disabled;;
    * ) echo "Please answer yes or no.";;
esac

FOLDER="RNBinarySizeMeasurer-$rn_version-Proguard$PROGUARD_SUFFIX"
FOLDER=${FOLDER//-/_}
FOLDER=${FOLDER//./_}

react-native init --version="$rn_version" $FOLDER
cd $FOLDER/android
if [ $ENABLE_PROGUARD -eq 1 ]; then
  echo "Enabling proguard"
  sed -i -e 's/enableProguardInReleaseBuilds = false/enableProguardInReleaseBuilds = true/g' app/build.gradle
fi

# Build
./gradlew --offline assembleRelease

# Print output dir
ls -lh app/build/outputs/apk
