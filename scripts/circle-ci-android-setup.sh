# inspired by https://github.com/Originate/guide/blob/master/android/guide/Continuous%20Integration.md

function getAndroidSDK {
  export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$PATH"
  echo y | android update sdk --no-ui --all --filter android-23
  echo y | android update sdk --no-ui --all --filter sys-img-armeabi-v7a-android-23

  DEPS="$ANDROID_HOME/installed-dependencies"

  if [ ! -e $DEPS ]; then
    echo no | android create avd -n testAVD -f -t android-23 --abi default/armeabi-v7a &&
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
