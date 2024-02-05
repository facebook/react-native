/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

group = "com.facebook.react"

plugins {
  // kotlin-dsl implies embedded Kotlin and is recommended for Kotlin Gradle plugins
  // https://docs.gradle.org/current/userguide/kotlin_dsl.html#sec:kotlin-dsl_plugin
  `kotlin-dsl`
  `maven-publish`
  id("com.gradle.plugin-publish") version "1.2.1"
}

repositories {
  // Use Maven Central for resolving dependencies.
  mavenCentral()
}

dependencies {
  // Use the Kotlin JUnit 5 integration.
  testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")

  implementation(gradleApi())
  testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

gradlePlugin {
  website = "https://reactnative.dev"
  vcsUrl = "https://github.com/facebook/react-native"
  plugins {
    create("nodeJsResolver") {
      id = "com.facebook.react.nodejsresolver"
      version = "0.1.0-alpha-0"
      displayName = "Node.js resolver plugin used by React Native"
      description =
          "A Gradle Plugin for correctly resolving node_modules paths from your build/settings.gradle"
      tags.set(listOf("react", "node", "nodejs", "node_modules", "resolver", "resolution"))
      implementationClass = "com.facebook.react.nodejsresolver.NodeJsResolverGradlePlugin"
    }
  }
}

tasks.named<Test>("test") {
  // Use JUnit Jupiter for unit tests.
  useJUnitPlatform()
}
