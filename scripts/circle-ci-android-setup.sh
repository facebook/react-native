# inspired by https://github.com/Originate/guide/blob/master/android/guide/Continuous%20Integration.md

function getAndroidSDK {
  export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$PATH"

  DEPS="$ANDROID_HOME/installed-dependencies"

  if [ ! -e $DEPS ]; then
    sdkmanager --update
    sdkmanager "system-images;android-23;google_apis;armeabi-v7a"
    sdkmanager "add-ons;addon-google_apis-google-23"
    echo no | avdmanager create avd --name testAVD --force --package "system-images;android-23;google_apis;armeabi-v7a" --tag google_apis --abi armeabi-v7a && touch $DEPS
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
