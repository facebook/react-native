#!/bin/bash
# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

RED="\033[0;31m"
GREEN="\033[0;32m"
BLUE="\033[0;35m"
ENDCOLOR="\033[0m"

error() {
    echo -e "$RED""$*""$ENDCOLOR"
    popd >/dev/null || exit
    exit 1
}

success() {
    echo -e "$GREEN""$*""$ENDCOLOR"
}

info() {
    echo -e "$BLUE""$*""$ENDCOLOR"
}

# Ensures commands are executed from the repo root folder
dir_absolute_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" || exit ; pwd -P )
pushd "$dir_absolute_path/../" >/dev/null || exit

repo_root=$(pwd)
selected_platform=""
selected_vm=""
PACKAGE_VERSION=""

test_android(){
    generate_maven_artifacts
    if [ "$1" == "1" ]; then
        test_android_hermes
    elif [ "$1" == "2" ]; then
        test_android_jsc
    fi
}

generate_maven_artifacts(){
    rm -rf android
    ./gradlew :ReactAndroid:installArchives || error "Couldn't generate artifacts"

    success "Generated artifacts for Maven"
}

test_android_hermes(){
    ./gradlew :packages:rn-tester:android:app:installHermesDebug || error "Couldn't build RNTester Android"

    info "Press any key to run RNTester on Android with Hermes enabled"
    info ""
    read -r -n 1
    adb shell am start -n com.facebook.react.uiapp/.RNTesterActivity
}

test_android_jsc(){
    ./gradlew :packages:rn-tester:android:app:installJscDebug || error "Couldn't build RNTester Android"

    info "Press any key to run RNTester in an already running Android emulator/device"
    info ""
    read -r -n 1
    adb shell am start -n com.facebook.react.uiapp/.RNTesterActivity
}

test_ios(){
    if [ "$1" == "1" ]; then
        test_ios_hermes
    elif [ "$1" == "2" ]; then
        test_ios_jsc
    fi
}

test_ios_hermes(){
    success "About to test iOS Hermes... "
    success "Installing CocoaPods dependencies..."
    rm -rf packages/rn-tester/Pods
    (cd packages/rn-tester && USE_HERMES=1 bundle exec pod install)

    info "Press any key to open the workspace in Xcode, then build and test manually."
    info ""
    read -r -n 1

    open "packages/rn-tester/RNTesterPods.xcworkspace"
}

test_ios_jsc(){
    success "About to test iOS JSC... "
    success "Installing CocoaPods dependencies..."
    rm -rf packages/rn-tester/Pods
    (cd packages/rn-tester && USE_HERMES=0 bundle exec pod install)

    info "Press any key to open the workspace in Xcode, then build and test manually."
    info ""
    read -r -n 1

    open "packages/rn-tester/RNTesterPods.xcworkspace"
}

kill_packagers(){
    success "Killing any running packagers"
    lsof -i :8081 | grep LISTEN
    lsof -i :8081 | grep LISTEN | /usr/bin/awk '{print $2}' | xargs kill
}

init_template_app(){
    kill_packagers

    PACKAGE_VERSION=$(cat package.json \
    | grep version \
    | head -1 \
    | awk -F: '{ print $2 }' \
    | sed 's/[",]//g' \
    | tr -d '[[:space:]]')

    success "Preparing version $PACKAGE_VERSION"

    npm pack

    TIMESTAMP=$(date +%s)
    PACKAGE=$(pwd)/react-native-$PACKAGE_VERSION-$TIMESTAMP.tgz
    success "Package bundled ($PACKAGE)"

    mv "$(pwd)/react-native-$PACKAGE_VERSION.tgz" "$PACKAGE"

    node scripts/set-rn-template-version.js "file:$PACKAGE"
    success "React Native version changed in the template"

    project_name="RNTestProject"

    pushd /tmp/ >/dev/null || exit
    rm -rf "$project_name"
    node "$repo_root/cli.js" init "$project_name" --template "$repo_root"

    info "Double checking the versions in package.json are correct:"
    grep "\"react-native\": \".*react-native-$PACKAGE_VERSION-$TIMESTAMP.tgz\"" "/tmp/${project_name}/package.json" || error "Incorrect version number in /tmp/${project_name}/package.json"
    grep -E "com.facebook.react:react-native:\\+" "${project_name}/android/app/build.gradle" || error "Dependency in /tmp/${project_name}/android/app/build.gradle must be com.facebook.react:react-native:+"

    success "New sample project generated at /tmp/${project_name}"
    popd >/dev/null || exit
}

test_template_app(){
    if [ "$PACKAGE_VERSION" == "" ]; then
        init_template_app
    fi

    pushd "/tmp/${project_name}" >/dev/null || exit
    if [ "$selected_platform" == "1" ]; then
        info "Test the following on Android:"
        info "   - Disable Fast Refresh. It might be enabled from last time (the setting is stored on the device)"
        info "   - Verify 'Reload JS' works"
        info ""
        info "Press any key to run the sample in Android emulator/device"
        info ""
        read -r -n 1
        npx react-native run-android
    elif [ "$selected_platform" == "2" ]; then
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
        open "ios/${project_name}.xcworkspace"
    fi
    popd >/dev/null || exit
}


show_menu(){
    echo "Which app do you want to test?
  1 - RNTester
  2 - A new RN app using the template"
    read -p "> " selected_app

    echo "What platform do you want to test?
  1 - Android
  2 - iOS"
    read -p "> " selected_platform

    if [ "$selected_app" == "1" ]; then
        echo "What VM are you testing?
  1 - Hermes
  2 - JSC"
        read -p "> " selected_vm
    fi

}

handle_menu_input(){
    if [ "$selected_app" == "1" ]; then
        info "Start the packager in another terminal by running 'npm start' from the root"
        info "and then press any key."
        info ""
        read -r -n 1

        if [ "$selected_platform" == "1" ]; then
            test_android "$selected_vm"
        elif [ "$selected_platform" == "2" ]; then
            test_ios "$selected_vm"
        fi
    elif [ "$selected_app" == "2" ]; then
        test_template_app
    fi

    read -p "Would you like to test something else? (Y/N)" confirm
    if [ "$confirm" == "${confirm#[Yy]}" ]; then
        info "Next steps:"
        info "https://reactnative.dev/contributing/release-candidate-minor"
        popd >/dev/null || exit
        exit 1
    else
        show_menu
        handle_menu_input
    fi
}

init(){
    show_menu
    yarn
    kill_packagers
    handle_menu_input
}

init
