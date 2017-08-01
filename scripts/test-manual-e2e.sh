#! /bin/bash

JAVA_VERSION="1.7"

RED="\033[0;31m"
GREEN="\033[0;32m"
BLUE="\033[0;35m"
ENDCOLOR="\033[0m"

error() {
    echo -e $RED"$@"$ENDCOLOR
    exit 1
}

success() {
    echo -e $GREEN"$@"$ENDCOLOR
}

info() {
    echo -e $BLUE"$@"$ENDCOLOR
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

npm install
npm pack

PACKAGE=$(pwd)/react-native-$PACKAGE_VERSION.tgz
success "Package bundled ($PACKAGE)"

project_name="RNTestProject"

cd /tmp/
rm -rf "$project_name"
react-native init "$project_name" --version $PACKAGE

info "Double checking the versions in package.json are correct:"
grep "\"react-native\": \".*react-native-$PACKAGE_VERSION.tgz\"" "/tmp/${project_name}/package.json" || error "Incorrect version number in /tmp/${project_name}/package.json"
grep -E "com.facebook.react:react-native:\\+" "${project_name}/android/app/build.gradle" || error "Dependency in /tmp/${project_name}/android/app/build.gradle must be com.facebook.react:react-native:+"

success "New sample project generated at /tmp/${project_name}"

info "Test the following on Android:"
info "   - Disable Hot Reloading. It might be enabled from last time (the setting is stored on the device)"
info "   - Verify 'Reload JS' works"
info ""
info "Press any key to run the sample in Android emulator/device"
info ""
read -n 1
cd "/tmp/${project_name}" && react-native run-android

info "Test the following on iOS:"
info "   - Disable Hot Reloading. It might be enabled from last time (the setting is stored on the device)"
info "   - Verify 'Reload JS' works"
info "   - Test Chrome debugger by adding breakpoints and reloading JS. We don't have tests for Chrome debugging."
info "   - Disable Chrome debugging."
info "   - Enable Hot Reloading, change a file (index.ios.js, index.android.js) and save. The UI should refresh."
info "   - Disable Hot Reloading."
info ""
info "Press any key to open the project in Xcode"
info ""
read -n 1
open "/tmp/${project_name}/ios/${project_name}.xcodeproj"

cd "$repo_root"

info "Next steps:"
info "   - https://github.com/facebook/react-native/blob/master/Releases.md"
