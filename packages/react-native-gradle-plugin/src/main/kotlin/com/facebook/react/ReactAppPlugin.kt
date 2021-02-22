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
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.kotlin.dsl.create
import org.gradle.kotlin.dsl.getByType

class ReactAppPlugin : Plugin<Project> {
  override fun apply(project: Project) {
    val config = project.extensions.create<ReactAppExtension>("reactApp", project)

    project.afterEvaluate {
      val androidConfiguration = extensions.getByType<BaseExtension>()
      configureDevPorts(androidConfiguration)

      val isAndroidLibrary = plugins.hasPlugin("com.android.library")
      val variants = if (isAndroidLibrary) {
        extensions.getByType<LibraryExtension>().libraryVariants
      } else {
        extensions.getByType<AppExtension>().applicationVariants
      }
      variants.all {
        configureReactTasks(
          variant = this,
          config = config
        )
      }
    }
  }
}
