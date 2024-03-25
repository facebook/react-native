/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

pluginManagement {
  repositories {
    mavenCentral()
    google()
    gradlePluginPortal()
  }
}

include(
    ":packages:react-native:ReactAndroid",
    ":packages:react-native:ReactAndroid:hermes-engine",
    ":packages:react-native:ReactAndroid:external-artifacts",
    ":packages:react-native-popup-menu-android:android",
    ":packages:rn-tester:android:app")

includeBuild("packages/react-native-gradle-plugin/")

dependencyResolutionManagement {
  versionCatalogs {
    create("libs") { from(files("packages/react-native/gradle/libs.versions.toml")) }
  }
}

rootProject.name = "react-native-github"

plugins {
  id("com.gradle.enterprise").version("3.7.1")
  id("org.gradle.toolchains.foojay-resolver-convention").version("0.5.0")
}

// If you specify a file inside gradle/gradle-enterprise.gradle.kts
// you can configure your custom Gradle Enterprise instance
if (File("./gradle/gradle-enterprise.gradle.kts").exists()) {
  apply(from = "./gradle/gradle-enterprise.gradle.kts")
}
