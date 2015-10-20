# Building React Native for Android

This guide contains instructions for building the Android code and running the sample apps.

## Supported Operating Systems

This setup has only been tested on Mac OS so far.

## Prerequisites

Assuming you have the [Android SDK](https://developer.android.com/sdk/installing/index.html) installed, run `android` to open the Android SDK Manager.

Make sure you have the following installed:

- Android SDK version 23 (compileSdkVersion in [`build.gradle`](build.gradle))
- SDK build tools version 23.0.1 (buildToolsVersion in [`build.gradle`](build.gradle))
- Android Support Repository >= 17 (for Android Support Library)
- Android NDK (download & extraction instructions [here](http://developer.android.com/ndk/downloads/index.html))

Point Gradle to your Android SDK: either have `$ANDROID_SDK` and `$ANDROID_NDK` defined, or create a `local.properties` file in the root of your `react-native` checkout with the following contents:

    sdk.dir=absolute_path_to_android_sdk
    ndk.dir=absolute_path_to_android_ndk

Example:

    sdk.dir=/Users/your_unix_name/android-sdk-macosx
    ndk.dir=/Users/your_unix_name/android-ndk/android-ndk-r10e

## Run `npm install`

This is needed to fetch the dependencies for the packager.

```bash
cd react-native
npm install
```

## Building from the command line

To build the framework code:

```bash
cd react-native
./gradlew :ReactAndroid:assembleDebug
```

To install a snapshot version of the framework code in your local Maven repo:

```bash
./gradlew :ReactAndroid:installArchives
```

## Running the examples

To run the UIExplorer app:

```bash
cd react-native
./gradlew :Examples:UIExplorer:android:app:installDebug
# Start the packager in a separate shell:
# Make sure you ran npm install
./packager/packager.sh
# Open UIExplorer in your emulator, Menu button -> Reload JS should work
```

You can run any other sample app the same way, e.g.:

```bash
./gradlew :Examples:Movies:android:app:installDebug
```

## Building from Android Studio

You'll need to do one additional step until we release the React Native Gradle plugin to Maven central. This is because Android Studio has its own local Maven repo:

    mkdir -p /Applications/Android\ Studio.app/Contents/gradle/m2repository/com/facebook/react
    cp -r ~/.m2/repository/com/facebook/react/gradleplugin /Applications/Android\ Studio.app/Contents/gradle/m2repository/com/facebook/react/

Now, open Android Studio, click _Import Non-Android Studio project_ and find your `react-native` repo.

In the configurations dropdown, _app_ should be selected. Click _Run_.

## Installing the React Native .aar in your local Maven repo

In some cases, for example when working on the `react-native-cli` it's useful to publish a snapshot version of React Native into your local Maven repo. This way, Gradle can pick it up when building projects that have a Maven dependency on React Native.

Run:

```bash
cd react-native-android
./gradlew :ReactAndroid:installArchives
```

## Troubleshooting

Gradle build fails in `ndk-build`. See the section about `local.properties` file above.

Gradle build fails "Could not find any version that matches com.facebook.react:gradleplugin:...". See the section about the React Native Gradle plugin above.

Packager throws an error saying a module is not found. Try running `npm install` in the root of the repo.
