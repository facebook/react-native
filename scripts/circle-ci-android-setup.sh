# inspired by https://github.com/Originate/guide/blob/master/android/guide/Continuous%20Integration.md

function getAndroidSDKandNDK {
  export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$PATH"

  DEPS="$ANDROID_HOME/installed-dependencies"

  if [ ! -e $DEPS ]; then
    # Update Android tools to make sdkmanager and avdmanager available
    echo y | android update sdk --no-ui --filter tools

    # Update SDK and create AVD
    yes | sdkmanager --update --verbose
    yes | sdkmanager "platforms;android-19" "system-images;android-19;default;armeabi-v7a" "extras;google;m2repository" --verbose
    echo no | avdmanager create avd -f -k 'system-images;android-19;default;armeabi-v7a' -n testAVD

    # Install NDK
    local ndk_zip=ndk.zip
    sudo mkdir -p $NDK_PATH
    sudo chown -R ${USER}:${USER} $NDK_PATH
    cd $NDK_PATH
    curl --silent https://dl.google.com/android/repository/android-ndk-r$NDK_VERSION-linux-x86_64.zip > $ndk_zip
    unzip -q $ndk_zip
    rm $ndk_zip

    # Accept licenses
    yes | sdkmanager --licenses

    touch $DEPS
  fi
}

function waitForAVD {
  local bootanim=""
  export PATH=$(dirname $(dirname $(which android)))/platform-tools:$PATH
  until [[ "$bootanim" =~ "stopped" ]]; do
    sleep 5
    bootanim=$(adb -e shell getprop init.svc.bootanim 2>&1)
    echo "emulator status=$bootanim"
  done
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
