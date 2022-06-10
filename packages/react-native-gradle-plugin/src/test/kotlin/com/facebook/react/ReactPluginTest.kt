/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.android.build.gradle.AppExtension
import org.gradle.testfixtures.ProjectBuilder
import org.junit.Assert.assertTrue
import org.junit.Test

class ReactPluginTest {

  @Test
  fun reactPlugin_withApplyAppPluginSetToTrue_addsARelevantTask() {
    val project = ProjectBuilder.builder().build()
    project.plugins.apply("com.android.application")
    project.plugins.apply("com.facebook.react")

    project.extensions.getByType(AppExtension::class.java).apply { compileSdkVersion(31) }
    project.extensions.getByType(ReactExtension::class.java).apply {
      applyAppPlugin.set(true)
      cliPath.set(".")
    }

    // We check if the App Plugin si applied by finding one of the added task.
    assertTrue(project.getTasksByName("bundleDebugJsAndAssets", false).isNotEmpty())
  }

  @Test
  fun reactPlugin_withApplyAppPluginSetToFalse_doesNotApplyTheAppPlugin() {
    val project = ProjectBuilder.builder().build()
    project.plugins.apply("com.android.application")
    project.plugins.apply("com.facebook.react")

    project.extensions.getByType(AppExtension::class.java).apply { compileSdkVersion(31) }
    project.extensions.getByType(ReactExtension::class.java).apply { applyAppPlugin.set(false) }

    assertTrue(project.getTasksByName("bundleDebugJsAndAssets", false).isEmpty())
  }

  @Test
  fun reactPlugin_withApplyAppPluginSetToFalse_codegenPluginIsApplied() {
    val project = ProjectBuilder.builder().build()
    project.plugins.apply("com.android.application")
    project.plugins.apply("com.facebook.react")

    project.extensions.getByType(AppExtension::class.java).apply { compileSdkVersion(31) }
    project.extensions.getByType(ReactExtension::class.java).apply { applyAppPlugin.set(false) }

    assertTrue(project.getTasksByName("buildCodegenCLI", false).isNotEmpty())
  }
}
