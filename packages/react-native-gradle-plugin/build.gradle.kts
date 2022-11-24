/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import org.gradle.api.internal.classpath.ModuleRegistry
import org.gradle.api.tasks.testing.logging.TestExceptionFormat
import org.gradle.configurationcache.extensions.serviceOf
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
  kotlin("jvm") version "1.6.10"
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

group = "com.facebook.react"

dependencies {
  implementation(gradleApi())
  implementation("com.android.tools.build:gradle:7.4.0-beta05")
  implementation("com.google.code.gson:gson:2.8.9")
  implementation("com.google.guava:guava:31.0.1-jre")
  implementation("com.squareup:javapoet:1.13.0")

  testImplementation("junit:junit:4.13.2")

  testRuntimeOnly(
      files(
          serviceOf<ModuleRegistry>()
              .getModule("gradle-tooling-api-builders")
              .classpath
              .asFiles
              .first()))
}

java {
  sourceCompatibility = JavaVersion.VERSION_11
  targetCompatibility = JavaVersion.VERSION_11
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
  kotlinOptions { jvmTarget = JavaVersion.VERSION_11.majorVersion }
}

tasks.withType<Test>().configureEach {
  testLogging {
    exceptionFormat = TestExceptionFormat.FULL
    showExceptions = true
    showCauses = true
    showStackTraces = true
  }
}
