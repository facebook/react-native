'use strict';

require(`shelljs/global`);

const RELEASE="$1";
const JAVA_VERSION="1.7";

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
