# Building React Native for Android

This guide contains instructions for building the Android code and running the sample apps.

## Supported Operating Systems

This setup has only been tested on Mac OS so far.

## Prerequisites

Assuming you have the [Android SDK](https://developer.android.com/sdk/installing/index.html) installed, run `android` to open the Android SDK Manager.

Make sure you have the following installed:

- Android SDK version 22 (compileSdkVersion in [`build.gradle`](build.gradle))
- SDK build tools version 22.0.1 (buildToolsVersion in [`build.gradle`](build.gradle))
- Android Support Repository 17 (for Android Support Library)
 
Point Gradle to your Android SDK - in the root of your clone of the github repo, create a file called `local.properties` with the following contents:

    sdk.dir=absolute_path_to_android_sdk
    ndk.dir=absolute_path_to_android_ndk
  
Example:

    sdk.dir=/Users/your_unix_name/android-sdk-macosx
    ndk.dir=/Users/your_unix_name/android-ndk/android-ndk-r10c

## Run `npm install`

This is needed to fetch the dependencies for the packager.

```bash
cd react-native-android
npm install
```

## Building from the command line

To build the framework code:

```bash
cd react-native-android
./gradlew :ReactAndroid:assembleDebug
```

To install a snapshot version of the framework code in your local Maven repo:

```bash
./gradlew :ReactAndroid:installArchives
```

## Running the examples

To run the Sample app:

```bash
cd react-native-android
./gradlew :Examples:SampleApp:android:app:installDebug
# Start the packager in a separate shell:
# Make sure you ran npm install
./packager/packager.sh
# Open SampleApp in your emulator, Menu button -> Reload JS should work
```

You can run any other sample app the same way, e.g.:

```bash
./gradlew :Examples:Movies:android:app:installDebug
./gradlew :Examples:UIExplorer:android:app:installDebug
```

## Building from Android Studio

You'll need to do one additional step until we release the React Native Gradle plugin to Maven central. This is because Android Studio has its own local Maven repo:
    
    mkdir -p /Applications/Android\ Studio.app/Contents/gradle/m2repository/com/facebook/react
    cp -r ~/.m2/repository/com/facebook/react/gradleplugin /Applications/Android\ Studio.app/Contents/gradle/m2repository/com/facebook/react/

Now, open Android Studio, click _Import Non-Android Studio project_ and find your `react-native-android` repo.
  
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
