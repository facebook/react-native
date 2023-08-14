/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import org.jetbrains.kotlin.gradle.plugin.extraProperties

plugins {
  alias(libs.plugins.android.library)
  alias(libs.plugins.kotlin.android)
  id("maven-publish")
  id("signing")
}

group = "com.facebook.react"

version =
    parent?.extraProperties?.get("publishing_version")
        ?: error("publishing_version not set for flipper-integration")

repositories {
  // Normally RNGP will set repositories for all modules,
  // but when consumed from source, we need to re-declare
  // those repositories as there is no app module there.
  mavenCentral()
  google()
}

android {
  compileSdk = libs.versions.compileSdk.get().toInt()
  buildToolsVersion = libs.versions.buildTools.get()
  namespace = "com.facebook.react.flipper"

  defaultConfig { minSdk = libs.versions.minSdk.get().toInt() }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }

  kotlin { jvmToolchain(17) }

  dependencies {
    implementation(project(":packages:react-native:ReactAndroid"))
    debugImplementation(libs.flipper)
    debugImplementation(libs.flipper.network.plugin) {
      exclude(group = "com.squareup.okhttp3", module = "okhttp")
    }
    debugImplementation(libs.flipper.fresco.plugin)
  }

  publishing {
    multipleVariants {
      withSourcesJar()
      allVariants()
    }
  }
}

apply(from = "../publish.gradle")
