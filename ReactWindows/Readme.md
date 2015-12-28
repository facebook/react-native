# Building React Native for Windows

This guide contains instructions for building the UWP code for React Native

## Supported Operating Systems

This setup has only been tested on Windows 10 so far. The target environment is for a Windows Phone UWP app.  

## Prerequisites

Assuming you have [Visual Studio 2015 Enterprise](\\products\PUBLIC\Products\Developers) installed, you will also need to have Windows 10 SDK installed. 

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
