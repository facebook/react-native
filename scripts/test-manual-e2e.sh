#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

JAVA_VERSION="1.7"

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

kill_packagers() {
    success "Killing any running packagers"
    lsof -i :8081 | grep LISTEN
    lsof -i :8081 | grep LISTEN | /usr/bin/awk '{print $2}' | xargs kill
}

REPO_ROOT=$(pwd)
CLI_PATH="$REPO_ROOT/cli.js"

PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

# Prepare
{
    info "Preparing version $PACKAGE_VERSION"

    npm install

    rm -rf android
    ./gradlew :ReactAndroid:installArchives || error "Couldn't generate artifacts"

    kill_packagers
}

# Test RNTester
{
    info "Start the packager in another terminal by running 'npm start' from the root"
    info "and then press any key."
    info ""
    read -n 1

    # Android
    {
        ./gradlew :RNTester:android:app:installJscDebug || error "Couldn't build RNTester Android"

        info "Press any key to run RNTester in an already running Android emulator/device"
        info ""
        read -n 1
        adb shell am start -n com.facebook.react.uiapp/.RNTesterActivity
    }

    # iOS
    pushd RNTester
    {
        info "Press any key to open the workspace in Xcode, then build and test manually."
        info ""
        read -n 1
        success "Installing CocoaPods dependencies"
        rm -rf Pods && pod install
        open "RNTesterPods.xcworkspace"
    }
    popd

    info "When done testing RNTester app on iOS and Android press any key to continue."
    info ""
    read -n 1

    kill_packagers
}

# Test new app from template
{
    npm pack

    PACKAGE=$(pwd)/react-native-$PACKAGE_VERSION.tgz
    success "Package bundled ($PACKAGE)"

    node scripts/set-rn-template-version.js "file:$PACKAGE"
    success "React Native version changed in the template"

    project_name="RNTestProject"
    project_dirname="/tmp"
    project_path="${project_dirname}/${project_name}"

    pushd "$project_dirname"
    {
        rm -rf "$project_name"
        node "$CLI_PATH" init "$project_name" --template "$REPO_ROOT"
    }
    popd

    info "Double checking the versions in package.json are correct:"
    grep "\"react-native\": \".*react-native-$PACKAGE_VERSION.tgz\"" "${project_path}/package.json" || error "Incorrect version number in ${project_path}/package.json"
    grep -E "com.facebook.react:react-native:\\+" "${project_path}/android/app/build.gradle" || error "Dependency in ${project_path}/android/app/build.gradle must be com.facebook.react:react-native:+"

    success "New sample project generated at ${project_path}"

    pushd "$project_path"
    {
        # Android
        {
            info "Test the following on Android:"
            info "   - Disable Fast Refresh. It might be enabled from last time (the setting is stored on the device)"
            info "   - Verify 'Reload JS' works"
            info ""
            info "Press any key to run the sample in Android emulator/device"
            info ""
            read -n 1
            node "$CLI_PATH" run-android
        }

        # iOS
        {
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
            read -n 1
            node "$CLI_PATH" run-ios
        }
    }
    popd
}

info "Next steps:"
info "   - https://github.com/facebook/react-native/blob/master/Releases.md"
