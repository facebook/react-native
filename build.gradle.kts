/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

val ndkPath by extra(System.getenv("ANDROID_NDK"))
val ndkVersion by extra(System.getenv("ANDROID_NDK_VERSION"))

buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:7.1.1")
        classpath("de.undercouch:gradle-download-task:5.0.1")
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
            url = uri("$rootDir/android")
        }
        google()
        mavenCentral {
            // We don't want to fetch react-native from Maven Central as there are
            // older versions over there.
            content {
                excludeGroup("com.facebook.react")
            }
        }
    }
}

tasks.register("cleanAll", Delete::class.java) {
    description = "Remove all the build files and intermediate build outputs"
    dependsOn(gradle.includedBuild("react-native-gradle-plugin").task(":clean"))
    delete(allprojects.map { it.buildDir })
    delete(rootProject.file("./ReactAndroid/.cxx"))
    delete(rootProject.file("./ReactAndroid/hermes-engine/.cxx"))
    delete(rootProject.file("./sdks/download/"))
    delete(rootProject.file("./sdks/hermes/"))
    delete(rootProject.file("./ReactAndroid/src/main/jni/prebuilt/lib/arm64-v8a/"))
    delete(rootProject.file("./ReactAndroid/src/main/jni/prebuilt/lib/armeabi-v7a/"))
    delete(rootProject.file("./ReactAndroid/src/main/jni/prebuilt/lib/x86/"))
    delete(rootProject.file("./ReactAndroid/src/main/jni/prebuilt/lib/x86_64/"))
    delete(rootProject.file("./packages/react-native-codegen/lib"))
    delete(rootProject.file("./packages/rn-tester/android/app/.cxx"))
}
