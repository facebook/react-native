/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.android.build.api.variant.AndroidComponentsExtension
import com.facebook.react.utils.ProjectUtils.isHermesEnabled
import com.facebook.react.utils.ProjectUtils.isNewArchEnabled
import org.gradle.api.Action
import org.gradle.api.Project
import org.gradle.api.plugins.AppliedPlugin

internal object AgpConfiguratorUtils {
  @Suppress("UnstableApiUsage")
  fun configureBuildConfigFields(project: Project) {
    val action =
        Action<AppliedPlugin> {
          project.extensions.getByType(AndroidComponentsExtension::class.java).finalizeDsl { ext ->
            ext.defaultConfig.buildConfigField(
                "boolean", "IS_NEW_ARCHITECTURE_ENABLED", project.isNewArchEnabled.toString())
            ext.defaultConfig.buildConfigField(
                "boolean", "IS_HERMES_ENABLED", project.isHermesEnabled.toString())
          }
        }
    project.pluginManager.withPlugin("com.android.application", action)
    project.pluginManager.withPlugin("com.android.library", action)
  }
}
