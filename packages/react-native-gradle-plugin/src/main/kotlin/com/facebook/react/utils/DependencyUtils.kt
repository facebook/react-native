/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import java.io.File
import java.net.URI
import java.util.*
import org.gradle.api.Project
import org.gradle.api.artifacts.repositories.MavenArtifactRepository

internal object DependencyUtils {

  fun configureRepositories(project: Project, reactNativeDir: File) {
    with(project) {
      if (hasProperty("REACT_NATIVE_MAVEN_LOCAL_REPO")) {
        mavenRepoFromUrl("file://${property("REACT_NATIVE_MAVEN_LOCAL_REPO")}")
      }
      // We add the snapshot for users on nightlies.
      mavenRepoFromUrl("https://oss.sonatype.org/content/repositories/snapshots/")
      repositories.mavenCentral()
      // All of React Native (JS, Obj-C sources, Android binaries) is installed from npm
      mavenRepoFromUrl("file://${reactNativeDir}/android")
      // Android JSC is installed from npm
      mavenRepoFromUrl("file://${reactNativeDir}/../jsc-android/dist")
      repositories.google()
      mavenRepoFromUrl("https://www.jitpack.io")
    }
  }

  fun configureDependencies(project: Project, versionString: String) {
    if (versionString.isBlank()) return
    project.configurations.all { configuration ->
      // Here we set a dependencySubstitution for both react-native and hermes-engine as those
      // coordinates are voided due to https://github.com/facebook/react-native/issues/35210
      // This allows users to import libraries that are still using
      // implementation("com.facebook.react:react-native:+") and resolve the right dependency.
      configuration.resolutionStrategy.dependencySubstitution {
        it.substitute(it.module("com.facebook.react:react-native"))
            .using(it.module("com.facebook.react:react-android:${versionString}"))
            .because(
                "The react-native artifact was deprecated in favor of react-android due to https://github.com/facebook/react-native/issues/35210.")
        it.substitute(it.module("com.facebook.react:hermes-engine"))
            .using(it.module("com.facebook.react:hermes-android:${versionString}"))
            .because(
                "The hermes-engine artifact was deprecated in favor of hermes-android due to https://github.com/facebook/react-native/issues/35210.")
      }
      configuration.resolutionStrategy.force(
          "com.facebook.react:react-android:${versionString}",
          "com.facebook.react:hermes-android:${versionString}",
      )
    }
  }

  fun readVersionString(propertiesFile: File): String {
    val reactAndroidProperties = Properties()
    propertiesFile.inputStream().use { reactAndroidProperties.load(it) }
    val versionString = reactAndroidProperties["VERSION_NAME"] as? String ?: ""
    // If on a nightly, we need to fetch the -SNAPSHOT artifact from Sonatype.
    return if (versionString.startsWith("0.0.0")) {
      "$versionString-SNAPSHOT"
    } else {
      versionString
    }
  }

  fun Project.mavenRepoFromUrl(url: String): MavenArtifactRepository =
      project.repositories.maven { it.url = URI.create(url) }
}
