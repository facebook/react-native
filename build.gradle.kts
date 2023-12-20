/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

plugins {
  alias(libs.plugins.nexus.publish)
  alias(libs.plugins.android.library) apply false
  alias(libs.plugins.android.application) apply false
  alias(libs.plugins.download) apply false
  alias(libs.plugins.kotlin.android) apply false
  alias(libs.plugins.binary.compatibility.validator) apply true
}

val reactAndroidProperties = java.util.Properties()

File("$rootDir/packages/react-native/ReactAndroid/gradle.properties").inputStream().use {
  reactAndroidProperties.load(it)
}

fun getListReactAndroidProperty(name: String) = reactAndroidProperties.getProperty(name).split(",")

apiValidation {
  ignoredPackages.addAll(
      getListReactAndroidProperty("react.internal.binaryCompatibilityValidator.ignoredPackages"))
  ignoredClasses.addAll(
      getListReactAndroidProperty("react.internal.binaryCompatibilityValidator.ignoredClasses"))
  nonPublicMarkers.addAll(
      getListReactAndroidProperty("react.internal.binaryCompatibilityValidator.nonPublicMarkers"))
  validationDisabled =
      reactAndroidProperties
          .getProperty("react.internal.binaryCompatibilityValidator.validationDisabled")
          ?.toBoolean() == true
}

version =
    if (project.hasProperty("isSnapshot") &&
        (project.property("isSnapshot") as? String).toBoolean()) {
      "${reactAndroidProperties.getProperty("VERSION_NAME")}-SNAPSHOT"
    } else {
      reactAndroidProperties.getProperty("VERSION_NAME")
    }

group = "com.facebook.react"

val ndkPath by extra(System.getenv("ANDROID_NDK"))
val ndkVersion by extra(System.getenv("ANDROID_NDK_VERSION") ?: "26.0.10792818")
val sonatypeUsername = findProperty("SONATYPE_USERNAME")?.toString()
val sonatypePassword = findProperty("SONATYPE_PASSWORD")?.toString()

nexusPublishing {
  repositories {
    sonatype {
      username.set(sonatypeUsername)
      password.set(sonatypePassword)
    }
  }
}

tasks.register("clean", Delete::class.java) {
  description = "Remove all the build files and intermediate build outputs"
  dependsOn(gradle.includedBuild("react-native-gradle-plugin").task(":clean"))
  subprojects.forEach {
    if (it.project.plugins.hasPlugin("com.android.library") ||
        it.project.plugins.hasPlugin("com.android.application")) {
      dependsOn(it.tasks.named("clean"))
    }
  }
  delete(allprojects.map { it.layout.buildDirectory.asFile })
  delete(rootProject.file("./packages/react-native/ReactAndroid/.cxx"))
  delete(rootProject.file("./packages/react-native/ReactAndroid/hermes-engine/.cxx"))
  delete(rootProject.file("./packages/react-native/sdks/download/"))
  delete(rootProject.file("./packages/react-native/sdks/hermes/"))
  delete(
      rootProject.file("./packages/react-native/ReactAndroid/src/main/jni/prebuilt/lib/arm64-v8a/"))
  delete(
      rootProject.file(
          "./packages/react-native/ReactAndroid/src/main/jni/prebuilt/lib/armeabi-v7a/"))
  delete(rootProject.file("./packages/react-native/ReactAndroid/src/main/jni/prebuilt/lib/x86/"))
  delete(rootProject.file("./packages/react-native/ReactAndroid/src/main/jni/prebuilt/lib/x86_64/"))
  delete(rootProject.file("./packages/rn-tester/android/app/.cxx"))
}

tasks.register("build") {
  description = "Build and test all the React Native relevant projects."
  dependsOn(gradle.includedBuild("react-native-gradle-plugin").task(":build"))
}

tasks.register("publishAllToMavenTempLocal") {
  description = "Publish all the artifacts to be available inside a Maven Local repository on /tmp."
  dependsOn(":packages:react-native:ReactAndroid:publishAllPublicationsToMavenTempLocalRepository")
  // We don't publish the external-artifacts to Maven Local as CircleCI is using it via workspace.
  dependsOn(
      ":packages:react-native:ReactAndroid:hermes-engine:publishAllPublicationsToMavenTempLocalRepository")
}

tasks.register("publishAllToSonatype") {
  description = "Publish all the artifacts to Sonatype (Maven Central or Snapshot repository)"
  dependsOn(":packages:react-native:ReactAndroid:publishToSonatype")
  dependsOn(":packages:react-native:ReactAndroid:external-artifacts:publishToSonatype")
  dependsOn(":packages:react-native:ReactAndroid:hermes-engine:publishToSonatype")
}

if (project.findProperty("react.internal.useHermesNightly")?.toString()?.toBoolean() == true) {
  logger.warn(
      """
      ********************************************************************************
      INFO: You're using Hermes from nightly as you set

      react.internal.useHermesNightly=true

      in the ./gradle.properties file.

      That's fine for local development, but you should not commit this change.
      ********************************************************************************
  """
          .trimIndent())
  allprojects {
    configurations.all {
      resolutionStrategy.dependencySubstitution {
        substitute(project(":packages:react-native:ReactAndroid:hermes-engine"))
            .using(module("com.facebook.react:hermes-android:0.0.0-+"))
            .because("Users opted to use hermes from nightly")
      }
    }
  }
}
