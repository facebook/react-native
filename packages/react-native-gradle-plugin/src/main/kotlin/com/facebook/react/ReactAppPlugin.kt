/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.android.build.gradle.AppExtension
import com.android.build.gradle.BaseExtension
import com.android.build.gradle.LibraryExtension
import com.facebook.react.codegen.plugin.CodegenPlugin
import com.facebook.react.utils.GradleUtils.createOrGet
import org.gradle.api.Plugin
import org.gradle.api.Project

class ReactAppPlugin : Plugin<Project> {
  override fun apply(project: Project) {
    applyAppPlugin(project)
    applyCodegenPlugin(project)
  }

  private fun applyAppPlugin(project: Project) {
    val config = project.extensions.createOrGet("react", ReactExtension::class.java, project)

    if (config.applyAppPlugin.getOrElse(false)) {
      project.afterEvaluate {
        val androidConfiguration = project.extensions.getByType(BaseExtension::class.java)
        project.configureDevPorts(androidConfiguration)

        val isAndroidLibrary = project.plugins.hasPlugin("com.android.library")
        val variants =
            if (isAndroidLibrary) {
              project.extensions.getByType(LibraryExtension::class.java).libraryVariants
            } else {
              project.extensions.getByType(AppExtension::class.java).applicationVariants
            }
        variants.all { project.configureReactTasks(variant = it, config = config) }
      }
    }
  }

  private fun applyCodegenPlugin(project: Project) {
    CodegenPlugin().apply(project)
  }
}
