#! /bin/bash

RELEASE="$1"
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

[[ -z $RELEASE ]] && error "Please specify a version. Example usage: release.sh 0.18"

repo_root=$(pwd)

git branch | grep -o ${RELEASE}-stable && error "Branch already exists"
java -version 2>&1 | grep ${JAVA_VERSION} || error "Java version must be 1.7.x in order to generate Javadoc. Check: java -version"

git pull || error "Couldn't pull from remote repository"
git checkout -b ${RELEASE}-stable || error "Couldn't create branch"

success "Created release branch: ${RELEASE}-stable"

sed -i.bak s/^VERSION_NAME=[0-9\.]*-SNAPSHOT/VERSION_NAME=${RELEASE}.0/g "ReactAndroid/gradle.properties" || error "Couldn't update version for Gradle"
# Uncomment Javadoc generation
sed -i.bak s:\/\/\ archives\ androidJavadocJar:archives\ androidJavadocJar:g "ReactAndroid/release.gradle" || error "Couldn't enable Javadoc generation"
./gradlew :ReactAndroid:installArchives || error "Couldn't generate artifacts"
# Revert Javadoc generation
sed -i.bak s:archives\ androidJavadocJar:\/\/\ archives\ androidJavadocJar:g "ReactAndroid/release.gradle" || error "Couldn't enable Javadoc generation"

artifacts_list=( -javadoc.jar -sources.jar .aar .pom )
artifacts_dir=~/.m2/repository/com/facebook/react/react-native/${RELEASE}.0

for i in "${artifacts_list[@]}"; do
   artifact_file="${artifacts_dir}/react-native-${RELEASE}.0${i}"
   [ -e "${artifact_file}" ] || error "Couldn't find file: ${artifact_file}"
done

success "Generated artifacts for Maven"

sed -i.bak -E "s/(\"version\":[[:space:]]*\").+(\")/\"version\": \"${RELEASE}.0-rc\"/g" "package.json" || error "Couldn't update version for npm"
sed -i.bak -E "s/(s.version[[:space:]]{13}=[[:space:]].+)/s.version             = \"${RELEASE}.0-rc\"/g" "React.podspec" || error "Couldn't update version for CocoaPods"

success "Updated version numbers"

npm_registry="http://localhost:4873/"

npm set registry "${npm_registry}" && [[ $(npm config list | grep registry) == "registry = \"${npm_registry}\"" ]] || error "Couldn't set registry to ${npm_registry}"

info "npm registry set. Run 'sinopia' in a new Terminal"
info "   - Make sure it prints 'http address - ${npm_registry}'"
info "   - Make sure ${npm_registry} shows no old versions"
info ""
info "Press any key to continue"
read -n 1

npm unpublish --force || error "Couldn't unpublish package from sinopia (${npm_registry})"
npm publish || error "Couldn't publish package to sinopia (${npm_registry})"

success "Published package to sinopia (${npm_registry})"

project_name="RNTestProject"

cd /tmp/
rm -rf "$project_name"
react-native init "$project_name"

info "Double checking the versions in package.json and build.gradle are correct:"
grep "\"react-native\": \"\^${RELEASE}.0-rc\"" "/tmp/${project_name}/package.json" || error "Incorrect version number in /tmp/${project_name}/package.json"
grep -E "com.facebook.react:react-native:\\+" "${project_name}/android/app/build.gradle" || error "Dependency in /tmp/${project_name}/android/app/build.gradle must be com.facebook.react:react-native:+"

success "New sample project generated at /tmp/${project_name}"

info "Test the following both on Android and iOS:"
info "   - Verify that packager opens in new Window"
info "   - Verify that you see the 'Welcome to React Native' screen"
info "   - Verify 'Reload JS' works"
info "   - Test Chrome debugger by adding breakpoints. We don't have tests for Chrome debugging."
info ""

info "Press any key to run the sample in Android emulator/device"
read -n 1
cd "${project_name}" && react-native run-android

info "Press any key to open the project in XCode"
read -n 1
open "/tmp/${project_name}/ios/${project_name}.xcodeproj"

cd "$repo_root"

info "Press any key to commit changes"
read -n 1
git commit -am "[${RELEASE}.0-rc] Bump version numbers"

find . -path "*.bak" | xargs rm

info "Next steps:"
info "   - git push origin ${RELEASE}-stable"
info "   - git tag v${RELEASE}.0-rc ${RELEASE}-stable"
info "   - git push --tags"
info "   - npm set registry https://registry.npmjs.org/"
info "   - When doing a RC release: npm publish --tag next"
info "   - When doing a non-RC release: npm publish  # Sets the latest tag automatically"
