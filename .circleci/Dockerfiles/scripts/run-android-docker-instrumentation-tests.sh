#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# for buck gen
mount -o remount,exec /dev/shm

AVD_UUID=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 8 | head -n 1)

# create virtual device
echo no | android create avd -n "$AVD_UUID" -f -t android-21 --abi default/armeabi-v7a

# emulator setup
emulator64-arm -avd $AVD_UUID -no-skin -no-audio -no-window -no-boot-anim &
bootanim=""
until [[ "$bootanim" =~ "stopped" ]]; do
    sleep 5
    bootanim=$(adb -e shell getprop init.svc.bootanim 2>&1)
    echo "boot animation status=$bootanim"
done

set -x

# solve issue with max user watches limit
echo 65536 | tee -a /proc/sys/fs/inotify/max_user_watches
watchman shutdown-server

# integration tests
# build JS bundle for instrumentation tests
node cli.js bundle --platform android --dev true --entry-file ReactAndroid/src/androidTest/js/TestBundle.js --bundle-output ReactAndroid/src/androidTest/assets/AndroidTestBundle.js

# build test APK
# shellcheck disable=SC1091
source ./scripts/android-setup.sh && NO_BUCKD=1 scripts/retry3 buck install ReactAndroid/src/androidTest/buck-runner:instrumentation-tests --config build.threads=1

# run installed apk with tests
node ./.circleci/Dockerfiles/scripts/run-android-ci-instrumentation-tests.js "$*"
exit $?
