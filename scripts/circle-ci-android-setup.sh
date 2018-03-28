# inspired by https://github.com/Originate/guide/blob/master/android/guide/Continuous%20Integration.md

# SDK Built Tools revision, per http://facebook.github.io/react-native/docs/getting-started.html
ANDROID_SDK_BUILD_TOOLS_REVISION=23.0.1
# API Level we build with
ANDROID_SDK_BUILD_API_LEVEL="23"
# Minimum API Level we target, used for emulator image
ANDROID_SDK_TARGET_API_LEVEL="19"
# Emulator name
AVD_NAME="testAVD"

function getAndroidSDK {
  export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$PATH"

  DEPS="$ANDROID_HOME/installed-dependencies"

  if [ ! -e $DEPS ]; then
    echo "Installing Android API level $ANDROID_SDK_TARGET_API_LEVEL, Google APIs, ARM EABI v7a system image..."
    sdkmanager "system-images;android-$ANDROID_SDK_TARGET_API_LEVEL;google_apis;armeabi-v7a"
# x86 image requires hardware acceleration, which is not supported when running within the CircleCI Docker image
#    echo "Installing Android API level $ANDROID_SDK_TARGET_API_LEVEL, Google APIs, Intel x86 Atom system image..."
#    sdkmanager "system-images;android-$ANDROID_SDK_TARGET_API_LEVEL;google_apis;x86"
    echo "Installing build SDK for Android API level $ANDROID_SDK_BUILD_API_LEVEL..."
    sdkmanager "platforms;android-$ANDROID_SDK_BUILD_API_LEVEL"
    echo "Installing target SDK for Android API level $ANDROID_SDK_TARGET_API_LEVEL..."
    sdkmanager "platforms;android-$ANDROID_SDK_TARGET_API_LEVEL"
    echo "Installing SDK build tools, revision $ANDROID_SDK_BUILD_TOOLS_REVISION..."
    sdkmanager "build-tools;$ANDROID_SDK_BUILD_TOOLS_REVISION"
    echo "Installing Google APIs for Android API level $ANDROID_SDK_BUILD_API_LEVEL..."
    sdkmanager "add-ons;addon-google_apis-google-$ANDROID_SDK_BUILD_API_LEVEL"
    echo "Installing Android Support Repository"
    sdkmanager "extras;android;m2repository"
    touch $DEPS
  fi
}

function getAndroidNDK {
  NDK_HOME="/opt/ndk"
  DEPS="$NDK_HOME/installed-dependencies"

  if [ ! -e $DEPS ]; then
    cd $NDK_HOME
    echo "Downloading NDK..."
    curl -o ndk.zip https://dl.google.com/android/repository/android-ndk-r10e-linux-x86.zip
    curl -o ndk_64.zip https://dl.google.com/android/repository/android-ndk-r10e-linux-x86_64.zip
    unzip -o -q ndk.zip
    unzip -o -q ndk_64.zip
    echo "Installed Android NDK at $NDK_HOME"
    touch $DEPS
    rm ndk.zip
    rm ndk_64.zip
  fi
}

function createAVD {
  echo no | avdmanager create avd --name $AVD_NAME --force --package "system-images;android-$ANDROID_SDK_TARGET_API_LEVEL;google_apis;armeabi-v7a" --tag google_apis --abi armeabi-v7a
}

function launchAVD {
  # The AVD name here should match the one created in createAVD
  # emulator64-arm -avd $AVD_NAME -no-audio -no-window -no-boot-anim -gpu off
  emulator -avd $AVD_NAME -no-audio -no-window
}

function waitForAVD {
  echo "Waiting for Android Virtual Device to finish booting..."
  local bootanim=""
  export PATH=$(dirname $(dirname $(which android)))/platform-tools:$PATH
  until [[ "$bootanim" =~ "stopped" ]]; do
    sleep 5
    bootanim=$(adb -e shell getprop init.svc.bootanim 2>&1)
    echo "boot animation status=$bootanim"
  done
  echo "Android Virtual Device is ready."
}

function retry3 {
  local n=1
  local max=3
  local delay=1
  while true; do
    "$@" && break || {
      if [[ $n -lt $max ]]; then
        ((n++))
        echo "Command failed. Attempt $n/$max:"
        sleep $delay;
      else
        echo "The command has failed after $n attempts." >&2
        return 1
      fi
    }
  done
}
