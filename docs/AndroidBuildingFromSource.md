---
id: android-building-from-source
title: Building React Native from source
layout: docs
category: Guides (Android)
permalink: docs/android-building-from-source.html
banner: ejected
next: contributing
previous: android-ui-performance
---

You will need to build React Native from source if you want to work on a new feature/bug fix, try out the latest features which are not released yet, or maintain your own fork with patches that cannot be merged to the core.

## Prerequisites

Assuming you have the Android SDK installed, run `android` to open the Android SDK Manager.

Make sure you have the following installed:

1. Android SDK version 23 (compileSdkVersion in [`build.gradle`](https://github.com/facebook/react-native/blob/master/ReactAndroid/build.gradle))
2. SDK build tools version 23.0.1 (buildToolsVersion in [`build.gradle`](https://github.com/facebook/react-native/blob/master/ReactAndroid/build.gradle))
3. Android Support Repository >= 17 (for Android Support Library)
4. Android NDK (download links and installation instructions below)

### Point Gradle to your Android SDK:

**Step 1:**  Set environment variables through your local shell.

Note: Files may vary based on shell flavor. See below for examples from common shells.

- bash: `.bash_profile` or `.bashrc`
- zsh: `.zprofile` or `.zshrc`
- ksh: `.profile` or `$ENV`

Example:

```
export ANDROID_SDK=/Users/your_unix_name/android-sdk-macosx
export ANDROID_NDK=/Users/your_unix_name/android-ndk/android-ndk-r10e
```

**Step 2:** Create a `local.properties` file in the `android` directory of your react-native app with the following contents:

Example:

```
sdk.dir=/Users/your_unix_name/android-sdk-macosx
ndk.dir=/Users/your_unix_name/android-ndk/android-ndk-r10e
```

### Download links for Android NDK

1. Mac OS (64-bit) - http://dl.google.com/android/repository/android-ndk-r10e-darwin-x86_64.zip
2. Linux (64-bit) - http://dl.google.com/android/repository/android-ndk-r10e-linux-x86_64.zip
3. Windows (64-bit) - http://dl.google.com/android/repository/android-ndk-r10e-windows-x86_64.zip
4. Windows (32-bit) - http://dl.google.com/android/repository/android-ndk-r10e-windows-x86.zip

You can find further instructions on the [official page](http://developer.android.com/ndk/downloads/index.html).

## Building the source

#### 1. Installing the fork

First, you need to install `react-native` from your fork. For example, to install the master branch from the official repo, run the following:

```sh
npm install --save github:facebook/react-native#master
```

Alternatively, you can clone the repo to your `node_modules` directory and run `npm install` inside the cloned repo.

#### 2. Adding gradle dependencies

Add `gradle-download-task` as dependency in `android/build.gradle`:

```gradle
...
    dependencies {
        classpath 'com.android.tools.build:gradle:1.3.1'
        classpath 'de.undercouch:gradle-download-task:3.1.2'

        // NOTE: Do not place your application dependencies here; they belong
        // in the individual module build.gradle files
    }
...
```

#### 3. Adding the `:ReactAndroid` project

Add the `:ReactAndroid` project in `android/settings.gradle`:

```gradle
...
include ':ReactAndroid'

project(':ReactAndroid').projectDir = new File(
    rootProject.projectDir, '../node_modules/react-native/ReactAndroid')
...
```

Modify your `android/app/build.gradle` to use the `:ReactAndroid` project instead of the pre-compiled library, e.g. - replace `compile 'com.facebook.react:react-native:+'` with `compile project(':ReactAndroid')`:

```gradle
...
dependencies {
    compile fileTree(dir: 'libs', include: ['*.jar'])
    compile 'com.android.support:appcompat-v7:23.0.1'

    compile project(':ReactAndroid')

    ...
}
...
```

#### 4. Making 3rd-party modules use your fork

If you use 3rd-party React Native modules, you need to override their dependencies so that they don't bundle the pre-compiled library. Otherwise you'll get an error while compiling - `Error: more than one library with package name 'com.facebook.react'`.

Modify your `android/app/build.gradle`, and add:

```gradle
configurations.all {
    exclude group: 'com.facebook.react', module: 'react-native'
}
```

## Building from Android Studio

From the Welcome screen of Android Studio choose "Import project" and select the `android` folder of your app.

You should be able to use the _Run_ button to run your app on a device. Android Studio won't start the packager automatically, you'll need to start it by running `npm start` on the command line.

## Additional notes

Building from source can take a long time, especially for the first build, as it needs to download ~200 MB of artifacts and compile the native code. Every time you update the `react-native` version from your repo, the build directory may get deleted, and all the files are re-downloaded. To avoid this, you might want to change your build directory path by editing the `~/.gradle/init.gradle ` file:

```gradle
gradle.projectsLoaded {
    rootProject.allprojects {
        buildDir = "/path/to/build/directory/${rootProject.name}/${project.name}"
    }
}
```

## Building for Maven/Nexus deployment

If you find that you need to push up a locally compiled React Native .aar and related files to a remote Nexus repository, you can.

Start by following the `Point Gradle to your Android SDK` section of this page. Once you do this, assuming you have Gradle configured properly, you can then run the following command from the root of your React Native checkout to build and package all required files:

```
./gradlew ReactAndroid:installArchives
```

This will package everything that would typically be included in the `android` directory of your `node_modules/react-native/` installation in the root directory of your React Native checkout.

## Testing

If you made changes to React Native and submit a pull request, all tests will run on your pull request automatically. To run the tests locally, see [Running Tests](docs/testing.html).

## Troubleshooting

Gradle build fails in `ndk-build`. See the section about `local.properties` file above.
