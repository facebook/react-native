Here's how to test the whole dev experience end-to-end. This will be eventually merged into the [Getting Started guide](https://reactnative.dev/docs/getting-started.html).

Assuming you have the [Android SDK](https://developer.android.com/sdk/installing/index.html) installed, run `android` to open the Android SDK Manager.

Make sure you have the following installed:

- Android SDK version 23
- SDK build tools version 23
- Android Support Repository 17 (for Android Support Library)

Follow steps on https://github.com/react-native-community/cli/blob/master/CONTRIBUTING.md, but be sure to bump the version of react-native in package.json to some version > 0.9 (latest published npm version) or set up proxying properly for react-native

- From the react-native-android repo:
  - `./gradlew :ReactAndroid:installArchives`
  - *Assuming you already have android-jsc installed to local maven repo, no steps included here*
- `react-native init ProjectName`
- Open up your Android emulator (Genymotion is recommended)
- `cd ProjectName`
- `react-native run-android`

In case the app crashed:

- Run `adb logcat` and try to find a Java exception
