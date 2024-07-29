REACT_NATIVE_PKG=$(find /tmp/react-native-tmp -type f -name "*.tgz")
echo "React Native tgs is $REACT_NATIVE_PKG"

MAVEN_LOCAL=/tmp/react-native-tmp/maven-local
echo "Maven local path is $MAVEN_LOCAL"

# TODO: from next/latest/main convert to branch
node ./scripts/e2e/init-project-e2e.js --projectName RNTestProject --currentBranch 0.75-stable  --directory /tmp/RNTestProject --pathToLocalReactNative $REACT_NATIVE_PKG

echo "Feed maven local to gradle.properties"
cd /tmp/RNTestProject
echo "react.internal.mavenLocalRepo=$MAVEN_LOCAL" >> android/gradle.properties

# Build
cd android
./gradlew assembleRelease --no-daemon -PreactNativeArchitectures=x86
