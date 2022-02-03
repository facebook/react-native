#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This script validates that Android is set up correctly for the
# testing environment.
#
# In particular, the config in ReactAndroid/build.gradle must match
# the android sdk that is actually installed. Also, we must have the
# right version of Java.

# Check that Buck is working.
if [ -z "$(which buck)" ]; then
  echo "You need to install Buck."
  echo "See https://buckbuild.com/setup/getting_started.html for instructions."
  exit 1
fi

if [ -z "$(buck --version)" ]; then
  echo "Your Buck install is broken."

  if [ -d "/opt/facebook" ]; then
    BUCK_SUGGESTED_COMMIT_FB="b9b76a3a5a086eb440a26d1db9b0731875975099"
    echo "FB laptops ship with a Buck config that is not compatible with open "
    echo "source. FB Buck requires the environment to set a buck version, but "
    echo "the open source version of Buck forbids that."
    echo
    echo "You can try setting:"
    echo
    echo "export BUCKVERSION=${BUCK_SUGGESTED_COMMIT_FB}"
    echo
    echo "in your .bashrc or .bash_profile to fix this."
    echo
    echo "If you don't want to alter BUCKVERSION for other things running on"
    echo "your machine, you can just scope it to a single script, for example"
    echo "by running something like:"
    echo
    echo "BUCKVERSION=${BUCK_SUGGESTED_COMMIT_FB} $0"
    echo
  else
    echo "I don't know what's wrong, but calling 'buck --version' should work."
  fi
  exit 1
else
  BUCK_EXPECTED_VERSION="buck version d743d2d0229852ce7c029ec257532d8916f6b2b7"
  if [ "$(buck --version)" != "$BUCK_EXPECTED_VERSION" ]; then
    if [ ! -d "/opt/facebook" ]; then
      echo "Warning: The test suite expects ${BUCK_EXPECTED_VERSION} to be installed"
    fi
  fi
fi

# MAJOR is something like "23"
MAJOR=`grep compileSdkVersion $(dirname $0)/../ReactAndroid/build.gradle | sed 's/[^[:digit:]]//g'`

# Check that we have the right major version of the Android SDK.
PLATFORM_DIR="$ANDROID_HOME/platforms/android-$MAJOR"
if [ ! -e "$PLATFORM_DIR" ]; then
  echo "Error: could not find version $ANDROID_VERSION of the Android SDK."
  echo "Specifically, the directory $PLATFORM_DIR does not exist."
  echo "You probably need to specify the right version using the SDK Manager from within Android Studio."
  echo "See https://reactnative.dev/docs/getting-started.html for details."
  echo "If you are using Android SDK Tools from the command line, you may need to run:"
  echo
  echo "  sdkmanager \"platform-tools\" \"platform-tools;android-$MAJOR\""
  echo
  echo "Check out https://developer.android.com/studio/command-line/sdkmanager.html for details."
  exit 1
fi

# Check that we have the right version of the build tools.
BT_DIR="$ANDROID_HOME/build-tools/$ANDROID_SDK_BUILD_TOOLS_REVISION"
if [ ! -e "$BT_DIR" ]; then
  echo "Error: could not find version $ANDROID_SDK_BUILD_TOOLS_REVISION of the Android build tools."
  echo "Specifically, the directory $BT_DIR does not exist."
  echo "You probably need to explicitly install the correct version of the Android SDK Build Tools from within Android Studio."
  echo "See https://reactnative.dev/docs/getting-started.html for details."
  echo "If you are using Android SDK Tools from the command line, you may need to run:"
  echo
  echo "  sdkmanager \"platform-tools\" \"build-tools;android-$ANDROID_SDK_BUILD_TOOLS_REVISION\""
  echo
  echo "Check out https://developer.android.com/studio/command-line/sdkmanager.html for details."
  exit 1
fi

if [ -n "$(which csrutil)" ]; then
  # This is a SIP-protected machine (recent OSX).
  # Check that we are not using SIP-protected Java.
  JAVA=`which java`
  if [ "$JAVA" = "/usr/bin/java" ]; then
    echo "Error: we can't use this Java version."
    echo "Currently, Java runs from $JAVA."
    echo "The operating-system-provided Java doesn't work with React Native because of SIP protection."
    echo "Please install the Oracle Java Development Kit 8."
    if [ -d "/opt/facebook" ]; then
      echo "See https://our.intern.facebook.com/intern/dex/installing-java-8/ for instructions on installing Java 8 on FB laptops."
    else
      echo "Check out http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html ."
      echo "Be sure that you set JAVA_HOME and PATH correctly in your .bashrc or equivalent. Example:"
      echo
      echo "  export JAVA_HOME=path/to/java"
      echo "  export PATH=\$PATH:\$JAVA_HOME/bin"
      echo
    fi
    echo "After installing Java, run 'buck kill' and 'buck clean'."
    exit 1
  fi
fi

if [ -z "$JAVA_HOME" ]; then
  echo "Error: \$JAVA_HOME is not configured."
  echo "Try adding export JAVA_HOME=\$(/usr/libexec/java_home) to your .bashrc or equivalent."
  echo "You will also want to add \$JAVA_HOME/bin to your path."
  exit 1
fi
