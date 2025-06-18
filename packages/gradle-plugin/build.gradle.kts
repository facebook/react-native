/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

plugins {
  alias(libs.plugins.kotlin.jvm).apply(false)
  alias(libs.plugins.ktfmt).apply(true)
}

tasks.register("build") {
  dependsOn(
      ":react-native-gradle-plugin:build",
      ":settings-plugin:build",
      ":shared-testutil:build",
      ":shared:build",
  )
}

tasks.register("clean") {
  dependsOn(
      ":react-native-gradle-plugin:clean",
      ":settings-plugin:clean",
      ":shared-testutil:clean",
      ":shared:clean",
  )
}

// Configure ktfmt tasks to run on all subprojects
tasks.named("ktfmtCheck") {
  subprojects.forEach { subproject ->
    if (subproject.plugins.hasPlugin("com.ncorti.ktfmt.gradle")) {
      dependsOn(subproject.tasks.named("ktfmtCheck"))
    }
  }
}

tasks.named("ktfmtFormat") {
  subprojects.forEach { subproject ->
    if (subproject.plugins.hasPlugin("com.ncorti.ktfmt.gradle")) {
      dependsOn(subproject.tasks.named("ktfmtFormat"))
    }
  }
}
