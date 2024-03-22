/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

plugins { alias(libs.plugins.android.library) }

// This task will trigger a autodownload of CMake using the SDK manager from Android
val downloadCmake by tasks.registering { dependsOn("buildCMakeDebug") }

group = "com.facebook.react"

version = parent?.properties?.get("publishing_version")?.toString()!!

val cmakeVersion = parent?.properties?.get("cmake_version")?.toString()!!

fun reactNativeArchitectures(): List<String> {
  val value = project.properties["reactNativeArchitectures"]
  return value?.toString()?.split(",") ?: listOf("armeabi-v7a", "x86", "x86_64", "arm64-v8a")
}

android {
  compileSdk = libs.versions.compileSdk.get().toInt()
  buildToolsVersion = libs.versions.buildTools.get()
  namespace = "com.facebook.hermes.cmakeautodownloader"

  if (rootProject.hasProperty("ndkPath") && rootProject.properties["ndkPath"] != null) {
    ndkPath = rootProject.properties["ndkPath"].toString()
  }
  if (rootProject.hasProperty("ndkVersion") && rootProject.properties["ndkVersion"] != null) {
    ndkVersion = rootProject.properties["ndkVersion"].toString()
  } else {
    ndkVersion = libs.versions.ndkVersion.get()
  }

  defaultConfig {
    externalNativeBuild { cmake { targets("cmakedownloader") } }
    ndk { abiFilters.addAll(reactNativeArchitectures()) }
  }

  externalNativeBuild {
    cmake {
      version = cmakeVersion
      path = project.file("CMakeLists.txt")
    }
  }
}
