'use strict';

/**
 * This script publishes a new version of react-native to NPM.
 * To reduce stress on developers it uses some logic to identify with which version to publish the package.
 *
 * To cut a branch (and release RC):
 * - Developer: `git checkout -b 0.XX-stable`
 * - Developer: `git push` to git@github.com:facebook/react-native.git (or merge as pull request)
 * - CI: test and deploy to npm (run this script) with version 0.XX.0 with tag "next"
 * - Developer: `git tag v0.XX.0` and `git push --tags` to git@github.com:facebook/react-native.git to hook Release Notes
 *
 * To update RC release:
 * - Developer: `git checkout 0.XX-stable`
 * - Developer: cherry-pick whatever changes needed
 * - Developer: `git push` to git@github.com:facebook/react-native.git (or merge as pull request)
 * - CI: test and deploy to npm (run this script) with version 0.XX.1 (incremented since what was pushed to npm) with tag "next"
 * - Developer: `git tag v0.XX.0` and `git push --tags` to git@github.com:facebook/react-native.git to hook Release Notes
 *
 * To publish release:
 * - Developer: `git checkout 0.XX-stable`
 * - Developer: cherry-pick whatever changes needed
 * - Developer: `git tag latest`
 * - Developer: `git push --tags` to git@github.com:facebook/react-native.git
 * - CI: test and deploy to npm (run this script) with version 0.XX.1 (incremented since what was pushed to npm) with tag "latest"
 *
 * To patch old release:
 * - Developer: `git checkout 0.XX-stable`
 * - Developer: cherry-pick whatever changes needed
 * - Developer: `git push` to git@github.com:facebook/react-native.git (or merge as pull request)
 * - CI: test and deploy to npm (run this script) with version 0.XX.Y (incremented since what was pushed to npm) with tag "patch"
 *
 */
require(`shelljs/global`);

const CIRCLE_BRANCH = process.env.CIRCLE_BRANCH || '0.23-stable';
const JAVA_VERSION="1.7";

let branchVersion;
if (CIRCLE_BRANCH.indexOf(`-stable`) !== -1) {
  branchVersion = CIRCLE_BRANCH.slice(0, CIRCLE_BRANCH.indexOf(`-stable`));
} else {
  echo(`Error: We publish only from stable branches`);
  exit(1);
}

// Java -version outputs to stderr 0_o
const javaVersion = exec(`java -version`).stderr;
if (javaVersion.indexOf(JAVA_VERSION) === -1) {
  echo(`Java version must be 1.7.x in order to generate Javadoc. Check: java -version`);
  exit(1);
}


/*

sed -i.bak s/^VERSION_NAME=[0-9\.]*-SNAPSHOT/VERSION_NAME=${RELEASE}.0/g "ReactAndroid/gradle.properties" || error "Couldn't update version for Gradle"
# Uncomment Javadoc generation
sed -i.bak s:\/\/\ archives\ androidJavadocJar:archives\ androidJavadocJar:g "ReactAndroid/release.gradle" || error "Couldn't enable Javadoc generation"
  ./gradlew :ReactAndroid:installArchives || error "Couldn't generate artifacts"
# Revert Javadoc generation
sed -i.bak s:archives\ androidJavadocJar:\/\/\ archives\ androidJavadocJar:g "ReactAndroid/release.gradle" || error "Couldn't enable Javadoc generation"

artifacts_list=( -javadoc.jar -sources.jar .aar .pom )
# ./gradlew :ReactAndroid:installArchives put the artifacts in react-native/android, ready to be published to npm
artifacts_dir="${repo_root}/android/com/facebook/react/react-native/${RELEASE}.0"

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
*/
