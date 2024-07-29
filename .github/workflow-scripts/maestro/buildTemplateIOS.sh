REACT_NATIVE_PKG=$(find /tmp/react-native-tmp -type f -name "*.tgz")
echo "React Native tgs is $REACT_NATIVE_PKG"

HERMES_PATH=$(find /tmp/react-native-tmp -type f -name "*.tar.gz")
echo "Hermes path is $HERMES_PATH"

# TODO: from next/latest/main convert to branch
node ./scripts/e2e/init-project-e2e.js --projectName RNTestProject --currentBranch 0.75-stable  --directory /tmp/RNTestProject --pathToLocalReactNative $REACT_NATIVE_PKG

cd /tmp/RNTestProject/ios
bundle install
HERMES_ENGINE_TARBALL_PATH=$HERMES_PATH bundle exec pod install

xcrun xcodebuild \
  -scheme "RNTestProject" \
  -workspace RNTestProject.xcworkspace \
  -configuration "Release" \
  -sdk "iphonesimulator" \
  -destination "generic/platform=iOS Simulator" \
  -derivedDataPath "/tmp/RNTestProject"
