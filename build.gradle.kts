/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

buildscript {
    repositories {
        mavenLocal()
        google()
        mavenCentral()
        jcenter {
          content {
            includeModule("org.jetbrains.trove4j", "trove4j")
          }
        }
    }
    dependencies {
        classpath("com.android.tools.build:gradle:4.1.0")
        classpath("de.undercouch:gradle-download-task:4.0.2")

        // NOTE: Do not place your application dependencies here; they belong
        // in the individual module build.gradle files
    }
}

allprojects {
    repositories {
        maven {
            url = uri("$rootDir/node_modules/jsc-android/dist")
        }
        maven {
            // https://github.com/wix/Detox/blob/master/docs/Introduction.Android.md
            // All of Detox's artifacts are provided via the npm module
            url = uri("$rootDir/node_modules/detox/Detox-android")
        }
        mavenLocal()
        google()
        mavenCentral()
        jcenter {
          content {
            includeModule("com.facebook.yoga", "proguard-annotations")
            // Fresco 2.4.0 and higher is not yet available in mavenCentral,
            // progress: https://github.com/facebook/fresco/issues/2603
            includeModule("com.facebook.fresco", "drawee")
            includeModule("com.facebook.fresco", "fbcore")
            includeModule("com.facebook.fresco", "flipper")
            includeModule("com.facebook.fresco", "fresco")
            includeModule("com.facebook.fresco", "imagepipeline-base")
            includeModule("com.facebook.fresco", "imagepipeline-native")
            includeModule("com.facebook.fresco", "imagepipeline")
            includeModule("com.facebook.fresco", "memory-type-ashmem")
            includeModule("com.facebook.fresco", "memory-type-java")
            includeModule("com.facebook.fresco", "memory-type-native")
            includeModule("com.facebook.fresco", "middleware")
            includeModule("com.facebook.fresco", "nativeimagefilters")
            includeModule("com.facebook.fresco", "nativeimagetranscoder")
            includeModule("com.facebook.fresco", "soloader")
            includeModule("com.facebook.fresco", "stetho")
            includeModule("com.facebook.fresco", "ui-common")
          }
        }
    }

    // used to override ndk path on CI
    if (System.getenv("LOCAL_ANDROID_NDK_VERSION") != null) {
      setProperty("ANDROID_NDK_VERSION", System.getenv("LOCAL_ANDROID_NDK_VERSION"))
    }
}
