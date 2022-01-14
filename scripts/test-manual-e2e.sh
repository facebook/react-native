#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

RED="\033[0;31m"
GREEN="\033[0;32m"
BLUE="\033[0;35m"
ENDCOLOR="\033[0m"

error() {
    echo -e "$RED""$*""$ENDCOLOR"
    exit 1
}

success() {
    echo -e "$GREEN""$*""$ENDCOLOR"
}

info() {
    echo -e "$BLUE""$*""$ENDCOLOR"
}

PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

success "Preparing version $PACKAGE_VERSION"

repo_root=$(pwd)

rm -rf android
./gradlew :ReactAndroid:installArchives || error "Couldn't generate artifacts"

success "Generated artifacts for Maven"

yarn

success "Killing any running packagers"
lsof -i :8081 | grep LISTEN
lsof -i :8081 | grep LISTEN | /usr/bin/awk '{print $2}' | xargs kill

info "Start the packager in another terminal by running 'npm start' from the root"
info "and then press any key."
info ""
read -r -n 1

./gradlew :packages:rn-tester:android:app:installJscDebug || error "Couldn't build RNTester Android"

info "Press any key to run RNTester in an already running Android emulator/device"
info ""
read -r -n 1
adb shell am start -n com.facebook.react.uiapp/.RNTesterActivity


info "Once done testing, keep emulator running"
info "Press any key to run RNTester on Android with Hermes enabled"
read -r -n 1

./gradlew :packages:rn-tester:android:app:installHermesDebug || error "Couldn't build RNTester Android"
adb shell am start -n com.facebook.react.uiapp/.RNTesterActivity

info "When done testing RNTester on Android,"
info "Press any key to start testing RNTester in iOS"
read -r -n 1

success "About to test iOS JSC... "
success "Installing CocoaPods dependencies..."
rm -rf packages/rn-tester/Pods
(cd packages/rn-tester && pod install)

info "Press any key to open the workspace in Xcode, then build and test manually."
info ""
read -r -n 1

open "packages/rn-tester/RNTesterPods.xcworkspace"

info "When done testing iOS JSC, press any key to test iOS Hermes"
read -r -n 1

success "About to test iOS Hermes... "
success "Installing CocoaPods dependencies..."
rm -rf packages/rn-tester/Pods
(cd packages/rn-tester && USE_HERMES=1 pod install)

info "Press any key to open the workspace in Xcode, then build and test manually."
info ""
read -r -n 1

open "packages/rn-tester/RNTesterPods.xcworkspace"

info "When done testing RNTester app on iOS and Android press any key to continue."
info ""
read -r -n 1

success "Killing packager"
lsof -i :8081 | grep LISTEN
lsof -i :8081 | grep LISTEN | /usr/bin/awk '{print $2}' | xargs kill

npm pack

TIMESTAMP=$(date +%s)
PACKAGE=$(pwd)/react-native-$PACKAGE_VERSION-$TIMESTAMP.tgz
success "Package bundled ($PACKAGE)"

mv "$(pwd)/react-native-$PACKAGE_VERSION.tgz" "$PACKAGE"

node scripts/set-rn-template-version.js "file:$PACKAGE"
success "React Native version changed in the template"

project_name="RNTestProject"

cd /tmp/ || exit
rm -rf "$project_name"
node "$repo_root/cli.js" init "$project_name" --template "$repo_root"

info "Double checking the versions in package.json are correct:"
grep "\"react-native\": \".*react-native-$PACKAGE_VERSION-$TIMESTAMP.tgz\"" "/tmp/${project_name}/package.json" || error "Incorrect version number in /tmp/${project_name}/package.json"
grep -E "com.facebook.react:react-native:\\+" "${project_name}/android/app/build.gradle" || error "Dependency in /tmp/${project_name}/android/app/build.gradle must be com.facebook.react:react-native:+"

success "New sample project generated at /tmp/${project_name}"

cd "/tmp/${project_name}" 

info "Test the following on Android:"
info "   - Disable Fast Refresh. It might be enabled from last time (the setting is stored on the device)"
info "   - Verify 'Reload JS' works"
info ""
info "Press any key to run the sample in Android emulator/device"
info ""
read -r -n 1
cd "/tmp/${project_name}" && npx react-native run-android

info "Test the following on iOS:"
info "   - Disable Fast Refresh. It might be enabled from last time (the setting is stored on the device)"
info "   - Verify 'Reload JS' works"
info "   - Test Chrome debugger by adding breakpoints and reloading JS. We don't have tests for Chrome debugging."
info "   - Disable Chrome debugging."
info "   - Enable Fast Refresh, change a file (index.js) and save. The UI should refresh."
info "   - Disable Fast Refresh."
info ""
info "Press any key to open the project in Xcode"
info ""
read -r -n 1
open "/tmp/${project_name}/ios/${project_name}.xcworkspace"

cd "$repo_root" || exit

info "Next steps:"
info "   - https://github.com/facebook/react-native/blob/HEAD/Releases.md"
