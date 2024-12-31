/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import org.gradle.api.tasks.testing.logging.TestExceptionFormat
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.kotlin.gradle.dsl.KotlinVersion
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins { alias(libs.plugins.kotlin.jvm) }

repositories { mavenCentral() }

group = "com.facebook.react"

dependencies {
  implementation(libs.gson)
  implementation(libs.guava)
  testImplementation(libs.junit)
  testImplementation(libs.assertj)
  testImplementation(project(":shared-testutil"))
}

java { targetCompatibility = JavaVersion.VERSION_11 }

kotlin { jvmToolchain(17) }

tasks.withType<KotlinCompile>().configureEach {
  compilerOptions {
    apiVersion.set(KotlinVersion.KOTLIN_1_7)
    // See comment above on JDK 11 support
    jvmTarget.set(JvmTarget.JVM_11)
    allWarningsAsErrors =
        project.properties["enableWarningsAsErrors"]?.toString()?.toBoolean() ?: false
  }
}

tasks.withType<Test>().configureEach {
  testLogging {
    exceptionFormat = TestExceptionFormat.FULL
    showExceptions = true
    showCauses = true
    showStackTraces = true
  }
}
