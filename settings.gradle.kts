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
  includeBuild("packages/gradle-plugin/")
}

include(
    ":packages:react-native:ReactAndroid",
    ":packages:react-native:ReactAndroid:hermes-engine",
    ":packages:react-native:ReactAndroid:external-artifacts",
    ":packages:rn-tester:android:app",
    ":packages:rn-tester:android:app:benchmark",
    ":private:react-native-fantom",
)

includeBuild("packages/gradle-plugin/")

dependencyResolutionManagement {
  versionCatalogs {
    create("libs") { from(files("packages/react-native/gradle/libs.versions.toml")) }
  }
}

rootProject.name = "react-native-github"

plugins {
  id("org.gradle.toolchains.foojay-resolver-convention").version("0.5.0")
  id("com.facebook.react.settings")
}

configure<com.facebook.react.ReactSettingsExtension> {
  autolinkLibrariesFromCommand(
      workingDirectory = file("packages/rn-tester/"),
      lockFiles = files("yarn.lock"),
  )
}

// Gradle properties defined in `gradle.properties` are not inherited by
// included builds, see https://github.com/gradle/gradle/issues/2534.
// This is a workaround to read the configuration from the consuming project,
// and apply relevant properties to the :react-native project.
buildscript {
  val properties = java.util.Properties()
  val propertiesToInherit = listOf("hermesV1Enabled", "react.hermesV1Enabled")

  try {
    file("../../android/gradle.properties").inputStream().use { properties.load(it) }

    gradle.rootProject {
      propertiesToInherit.forEach { property ->
        if (properties.containsKey(property)) {
          gradle.rootProject.extra.set(property, properties.getProperty(property))
        }
      }
    }
  } catch (e: Exception) {
    // fail silently
  }
}
