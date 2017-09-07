# inspired by https://github.com/Originate/guide/blob/master/android/guide/Continuous%20Integration.md

function getAndroidSDK {
  export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$PATH"

  DEPS="$ANDROID_HOME/installed-dependencies"

  if [ ! -e $DEPS ]; then
    echo "Updating installed packages..."
    sdkmanager --update
    echo "Installing SDKs..."
    sdkmanager "system-images;android-23;google_apis;armeabi-v7a"
    echo "Installing build tools..."
    sdkmanager "build-tools;23.0.1"
    echo "Installing add-ons..."
    sdkmanager "add-ons;addon-google_apis-google-23"
    touch $DEPS
  fi
}

function createAVD {
  # The package used here should match the package installed in getAndroidSDK
  echo no | avdmanager create avd --name testAVD --force --package "system-images;android-23;google_apis;armeabi-v7a" --tag google_apis --abi armeabi-v7a
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
    rm ndk.zip
    rm ndk_64.zip
    echo "Installed Android NDK at $NDK_HOME"
    touch $DEPS
  fi
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
