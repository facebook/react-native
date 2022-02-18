/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        val kotlin_version: String by project
        classpath("com.android.tools.build:gradle:7.0.4")
        classpath("de.undercouch:gradle-download-task:5.0.1")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version")
        // NOTE: Do not place your application dependencies here; they belong
        // in the individual module build.gradle files
    }
}

allprojects {
    repositories {
        maven {
            url = uri("$rootDir/node_modules/jsc-android/dist")
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
    delete(rootProject.file("./ReactAndroid/src/main/jni/prebuilt/lib/arm64-v8a/"))
    delete(rootProject.file("./ReactAndroid/src/main/jni/prebuilt/lib/armeabi-v7a/"))
    delete(rootProject.file("./ReactAndroid/src/main/jni/prebuilt/lib/x86/"))
    delete(rootProject.file("./ReactAndroid/src/main/jni/prebuilt/lib/x86_64/"))
    delete(rootProject.file("./packages/react-native-codegen/lib"))
    delete(rootProject.file("./packages/rn-tester/android/app/.cxx"))
}
