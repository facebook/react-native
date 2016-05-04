# inspired by https://github.com/Originate/guide/blob/master/android/guide/Continuous%20Integration.md

function getAndroidSDK {
  export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$PATH"

  DEPS="$ANDROID_HOME/installed-dependencies"

  if [ ! -e $DEPS ]; then
    # between android-19 and android-23 we often experience random native crashes
    # Fatal signal 11 (SIGSEGV) at 0xa7afc290 (code=2)
    # android-17 proved to be quite stable
    echo no | android create avd -n testAVD -f -t android-17 --abi default/armeabi-v7a &&
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

