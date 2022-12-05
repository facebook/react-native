# Building the app
Bulding manually *.app* and *.apk* is required to run automation tests on local environment. 

Before building app, make sure you ran:

```bash
cd react-native
yarn install
```
## Building for iOS

If you prevoiusly built RNTester, you may need to clean up build files and Pods:
```bash
rm -rf node_modules && yarn
cd packages/rn-tester
yarn clean-ios
```

Build the app for not M1 mac user: 

1. Install Bundler `gem install bundler`. We use bundler to install the right version of CocoaPods locally.
2. Install Bundler and CocoaPods dependencies: `bundle install && bundle exec pod install` or `yarn setup-ios-hermes`. In order to use JSC instead of Hermes engine, run: `USE_HERMES=0 bundle exec pod install` or `yarn setup-ios-jsc` instead.
3. Open the generated `RNTesterPods.xcworkspace`.
4. Build the app.

If you are M1 mac user:
1. Install ffi package `gem install ffi -v '1.15.5' --source 'https://rubygems.org/'`
2. Install pods with new architecture, e.g. using JSC `USE_HERMES=0 arch -x86_64 pod install`
3. Open the generated `RNTesterPods.xcworkspace`.
4. Build the app.

Find the **RNTester.app** in `~/Library/Developer/Xcode/DerivedData/RNTesterPods-{id}/Build/Products/Debug-iphonesimulator` and move the app to the following directory `/react-native/packages/rn-tester-e2e/apps`


## Building for Android
1. You'll need to have all the [prerequisites](https://reactnative.dev/contributing/how-to-build-from-source#prerequisites) (SDK, NDK) for Building React Native installed.

2. Start an Android emulator.
3. Build the app 
```sh
cd packages/rn-tester
# In order to use Hermes engine, run `yarn install-android-hermes` instead.
yarn install-android-jsc
yarn start
```

_Note: Building for the first time can take a while._

Find the **RNTester.app** in `~/AndroidStudioProjects/{ProjectName}/app/build/intermediates/apk/debug/` and move the app to the following directory `/react-native/packages/rn-tester-e2e/apps`


## Usage

In /react-native/packages/rn-tester-e2e

```bash
npm install
```

Go to
```bash
/react-native/packages/rn-tester-e2e/e2e-config.js
```
Prepare capabilities for your simulators

The next step is to run the appium

```bash
appium
```

After running appium open your simulator and

```bash
npm run android - for android
npm run ios - for ios
```



