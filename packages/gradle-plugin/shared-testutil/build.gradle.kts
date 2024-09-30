/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import org.gradle.api.tasks.testing.logging.TestExceptionFormat
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins { alias(libs.plugins.kotlin.jvm) }

repositories { mavenCentral() }

group = "com.facebook.react"

dependencies { implementation(libs.junit) }

java { targetCompatibility = JavaVersion.VERSION_11 }

kotlin { jvmToolchain(17) }

tasks.withType<KotlinCompile>().configureEach {
  kotlinOptions {
    apiVersion = "1.6"
    jvmTarget = "11"
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
