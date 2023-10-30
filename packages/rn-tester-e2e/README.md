# RNTester E2E folder

In this folder we have a the setup for running E2E testing in RNTester via the usage of [Appium](https://appium.io/) and [WebDriverIO](https://webdriver.io/).

- [Setting up locally](#setting-up-locally)
  - [Building RNTester app](#building-rntester-app)
    - [Building for iOS](#building-for-ios)
    - [Building for Android](#building-for-android)
  - [Setting up the RNTester E2E folder](#setting-up-the-rntester-e2e-folder)
- [Testing the RNTester app E2E](#testing-the-rntester-app-e2e)
- [Adding new tests (and project structure)](#adding-new-tests-and-project-structure)

## Setting up locally


### Building RNTester app

Building manually *.app* and *.apk* is required to run automation tests on local environment.

0. *(optional)* If you previously built RNTester, you may need to clean up build files and Pods:

    ```bash
    yarn test-e2e-local-clean && yarn install
    ```

1. Step 1: install packages for the repository, then navigate in the rn-tester folder

    ```bash
    cd react-native
    yarn install
    cd packages/rn-tester
    ```

Now, depending on the platform, there are some specific steps

#### Building for iOS

0. Make sure you have Bundler `gem install bundler` - we use it ensure installing the right version of CocoaPods locally.
1. Install Bundler and CocoaPods dependencies: `bundle install` then `bundle exec pod install` or `yarn setup-ios-hermes` for RNTester with Hermes. In order to use JSC instead of Hermes engine, run: `USE_HERMES=0 bundle exec pod install` or `setup-ios-jsc` instead.
2. You can build app with React Native CLI or manually with Xcode:
   1. To build with React Native CLI:
      1. Run `npx react-native build-ios --mode Debug --scheme RNTester --buildFolder /path/to/build-folder`, replace `/path/to/build-folder` with the real path.
      2. Copy the built app using `mv` - `mv /path/to/build-folder/Build/Products/Debug-iphonesimulator/RNTester.app ~/react-native/packages/rn-tester-e2e/apps` or manually.
   2. To build with Xcode, open the generated `RNTester.xcworkspace` and build.
      1. Find the **RNTester.app** in `~/Library/Developer/Xcode/DerivedData/RNTesterPods-{id}/Build/Products/Debug-iphonesimulator`
      2. Copy the app to the following directory `~/react-native/packages/rn-tester-e2e/apps`.
3. Change its name to: `rn-tester.app`

#### Building for Android

0. You'll need to have all the [prerequisites](https://reactnative.dev/contributing/how-to-build-from-source#prerequisites) (SDK, NDK) for Building React Native installed.
1. Start an Android emulator.
2. Build the app via

    ```bash
    # In order to not use Hermes engine, run `yarn install-android-jsc` instead.
    yarn install-android-hermes
    yarn start
    ```

    *Note: Building for the first time can take a while.*

3. Find the **app-*-debug.apk** in `~/react-native/packages/rn-tester/android/app/build/outputs/apk/hermes/debug`
4. Copy the app `app-*-debug.apk` to the following directory `~/react-native/packages/rn-tester-e2e/apps`
5. Change its name to: `rn-tester.apk`

### Setting up the RNTester E2E folder

In `react-native/packages/rn-tester-e2e` open the following file

```bash
/react-native/packages/rn-tester-e2e/e2e-config.js
```

And modify lines L24->L39 to reflect your local setup configuration (ex. `platformVersion`, `deviceName`). Make sure to **not** commit this change if you send a PR to add tests.

## Testing the RNTester app E2E

After you have done all the above correctly, and you have the Android/iOS apps in the `rn-tester-e2e/apps` folder.

Then open a second terminal window and start the Metro terminal from the `packages/rn-tester` folder, via `yarn start --reset-cache`. This terminal window also needs to keep running.

Now, make sure that the iOS simulator/the Android emulator is up and running.

Finally, you can open a third terminal window and run:

```bash
yarn test-e2e-android # for android
yarn test-e2e-ios # for ios
```

Now you should see the RNTester app being open, and the defined test being run.

## Adding new tests (and project structure)

This project has 2 main folders:

- `apps`, where, as you have seen above, the iOS/Android RNTester apps need to be put so that appium will pick them and install in the emulator/simulator consistently.

- `tests`, where the tests and referencing files all live. The substructure is as follows:
  - `screens` -> in this folder, you will find `*.screen.js` files, where each file represents a navigation screen for RNTester. So there are 3 root ones (`apis`, `bookmarks`, `components`) and then for subscreens, there's a folder with the same name - currently, that's only `components` that contains `buttonComponent.screen.js`. The content of these files is what was earlier mentioned as "references": they provide an easy way to define all elements present in said screen, so that they can be used for tests.
  - `specs` -> this folder follows a similar 1:1 mapping to the RNTester screens, but for the tests: for each screen (or subscreen) there's a dedicated folder file and within it theres test file (such as `invertedFlatList.test.js`).

When adding a new test, please ensure that you follow this pattern and add the relevant test in the right screen file / screen test file. Use the files mentioned above as examples.
