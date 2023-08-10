/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import org.jetbrains.kotlin.gradle.plugin.extraProperties

plugins {
  id("com.android.library")
  id("maven-publish")
  id("signing")
  id("org.jetbrains.kotlin.android")
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
  compileSdk = 33
  buildToolsVersion = "33.0.1"
  namespace = "com.facebook.react.flipper"

  defaultConfig { minSdk = 21 }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_11
    targetCompatibility = JavaVersion.VERSION_11
  }

  kotlin { jvmToolchain(11) }

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
