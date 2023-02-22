# RNTester E2E folder

In this folder we have a local setup for doing E2E testing over RNTester via the usage of Appium and WebDriverIO and Jest.

## Setting up

### (one-off) Setting up Appium

The first step you need to do is to ensure to install the tooling:

```bash
npm install appium@2.0.0-beta.53 -g
appium driver install uiautomator2
appium driver install xcuitest
```

> More details about drivers in Appium [here](https://appium.github.io/appium/docs/en/2.0/guides/managing-exts/) and [here](https://appium.github.io/appium/docs/en/2.0/quickstart/uiauto2-driver/)

### Building RNTester app

Building manually *.app* and *.apk* is required to run automation tests on local environment.

0. *(optional)* If you previously built RNTester, you may need to clean up build files and Pods:

    ```bash
    npm run test-e2e-local-clean
    ```

1. Step 1: install node modules for the repository, then navigate in the rn-tester folder

    ```bash
    cd react-native
    npm run install
    cd packages/rn-tester
    ```

Now, depending on the platform, there are some specific steps

#### Building for iOS

0. Make sure you have Bundler `gem install bundler` - we use it ensure installing the right version of CocoaPods locally.
1. Install Bundler and CocoaPods dependencies: `bundle install` then `bundle exec pod install` or `npm run setup-ios-hermes` for RNTester with Hermes. In order to use JSC instead of Hermes engine, run: `USE_HERMES=0 bundle exec pod install` or `setup-ios-jsc` instead.
2. Open the generated `RNTesterPods.xcworkspace`.
3. Build the app via XCode.
4. Find the **RNTester.app** in `~/Library/Developer/Xcode/DerivedData/RNTesterPods-{id}/Build/Products/Debug-iphonesimulator`
5. Copy the app to the following directory `/react-native/packages/rn-tester-e2e/apps`.


#### Building for Android

0. You'll need to have all the [prerequisites](https://reactnative.dev/contributing/how-to-build-from-source#prerequisites) (SDK, NDK) for Building React Native installed.
1. Start an Android emulator.
2. Build the app via

    ```bash
    # In order to not use Hermes engine, run `npm run install-android-jsc` instead.
    npm run install-android-hermes
    npm run start
    ```

    *Note: Building for the first time can take a while.*

3. Find the **RNTester.app** in `~/react-native/packages/rn-tester/android/app/build/outputs/apk/jsc/debug`
4. copy the app `app-*-x86_64-debug.apk` to the following directory `/react-native/packages/rn-tester-e2e/apps`
5. change its name name to: `rn-tester.apk`

### Setting up the RNTester E2E folder

In `react-native/packages/rn-tester-e2e` install the needed dependencies via:

```bash
npm install
```

We need to do this step because the folder is not part of the npm run workspace by design.

Then open the following file

```bash
/react-native/packages/rn-tester-e2e/e2e-config.js
```

And modify lines L14->L29 to reflect your local setup configuration (ex. `platformVersion`, `deviceName`).

## Testing the RNTester app E2E

After you have done all the above correctly, and you have the Android/iOS apps in the `rn-tester-e2e/apps` folder, in a dedicated terminal window, run:

```bash
appium --base-path /wd/hub
```

This will start the Appium server - you will need this to keep running.

Then open a second terminal window and start the Metro terminal from the `packages/rn-tester` folder, via `npm run start --reset-cache`. This terminal window also needs to keep running.

Now, make sure that the iOS simulator/the Android emulator is up and running.

Finally, you can open a third terminal window and run:

```bash
npm run test-android-e2e # for android
npm run test-ios-e2e # for ios
```

Now you should see the RNTester app being open, and the defined test being run.
