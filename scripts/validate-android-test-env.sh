#!/bin/bash

# This script validates that Android is set up correctly for the
# testing environment.
#
# In particular, the config in ReactAndroid/build.gradle must match
# the android sdk that is actually installed. Also, we must have the
# right version of Java.

# Check that Buck is working.
if [ -z "$(which buck)" ]; then
  echo "You need to install Buck."
  echo "See https://buckbuild.com/setup/install.htm for instructions."
  exit 1
fi

if [ -z "$(buck --version)" ]; then
  echo "Your Buck install is broken."

  if [ -d "/opt/facebook" ]; then
    SUGGESTED="b9b76a3a5a086eb440a26d1db9b0731875975099"
    echo "FB laptops ship with a Buck config that is not compatible with open "
    echo "source. FB Buck requires the environment to set a buck version, but "
    echo "the open source version of Buck forbids that."
    echo
    echo "You can try setting:"
    echo
    echo "export BUCKVERSION=${SUGGESTED}"
    echo
    echo "in your .bashrc or .bash_profile to fix this."
    echo
    echo "If you don't want to alter BUCKVERSION for other things running on"
    echo "your machine, you can just scope it to a single script, for example"
    echo "by running something like:"
    echo
    echo "BUCKVERSION=${SUGGESTED} $0"
    echo
  else
    echo "I don't know what's wrong, but calling 'buck --version' should work."
  fi
  exit 1
fi

# BUILD_TOOLS_VERSION is in a format like "23.0.1"
BUILD_TOOLS_VERSION=`grep buildToolsVersion $(dirname $0)/../ReactAndroid/build.gradle | sed 's/^[^"]*\"//' | sed 's/"//'`

# MAJOR is something like "23"
MAJOR=`echo $BUILD_TOOLS_VERSION | sed 's/\..*//'`

# Check that we have the right major version of the Android SDK.
PLATFORM_DIR="$ANDROID_HOME/platforms/android-$MAJOR"
if [ ! -e "$PLATFORM_DIR" ]; then
  echo "Error: could not find version $ANDROID_VERSION of the Android SDK."
  echo "Specifically, the directory $PLATFORM_DIR does not exist."
  echo "You probably need to specify the right version using the SDK Manager from within Android Studio."
  echo "See https://facebook.github.io/react-native/docs/getting-started.html for details."
  exit 1
fi

# Check that we have the right version of the build tools.
BT_DIR="$ANDROID_HOME/build-tools/$BUILD_TOOLS_VERSION"
if [ ! -e "$BT_DIR" ]; then
  echo "Error: could not find version $BUILD_TOOLS_VERSION of the Android build tools."
  echo "Specifically, the directory $BT_DIR does not exist."
  echo "You probably need to explicitly install the correct version of the Android SDK Build Tools from within Android Studio."
  echo "See https://facebook.github.io/react-native/docs/getting-started.html for details."
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
      echo "Be sure that you set JAVA_HOME and PATH correctly."
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


