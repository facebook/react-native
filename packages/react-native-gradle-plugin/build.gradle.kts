/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import org.gradle.api.internal.classpath.ModuleRegistry
import org.gradle.configurationcache.extensions.serviceOf

plugins {
  kotlin("jvm") version "1.5.31"
  id("java-gradle-plugin")
}

repositories {
  google()
  mavenCentral()
}

gradlePlugin {
  plugins {
    create("react") {
      id = "com.facebook.react"
      implementationClass = "com.facebook.react.ReactPlugin"
    }
  }
}

dependencies {
  implementation(gradleApi())
  implementation("com.android.tools.build:gradle:4.2.2")

  testImplementation("junit:junit:4.13.2")

  testRuntimeOnly(
    files(
      serviceOf<ModuleRegistry>().getModule("gradle-tooling-api-builders").classpath.asFiles.first()
    )
  )
}
