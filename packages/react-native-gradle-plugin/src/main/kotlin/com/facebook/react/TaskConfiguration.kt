/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.android.build.api.variant.Variant
import com.facebook.react.tasks.BundleHermesCTask
import com.facebook.react.utils.NdkConfiguratorUtils.configureJsEnginePackagingOptions
import com.facebook.react.utils.NdkConfiguratorUtils.configureNewArchPackagingOptions
import com.facebook.react.utils.ProjectUtils.isHermesEnabled
import com.facebook.react.utils.detectedCliFile
import com.facebook.react.utils.detectedEntryFile
import java.io.File
import org.gradle.api.Project

@Suppress("SpreadOperator", "UnstableApiUsage")
internal fun Project.configureReactTasks(variant: Variant, config: ReactExtension) {
  val targetName = variant.name.replaceFirstChar { it.uppercase() }
  val targetPath = variant.name

  // React js bundle directories
  val resourcesDir = File(buildDir, "generated/res/react/$targetPath")
  // Bundle: generated/assets/react/path/index.android.bundle
  val jsBundleDir = File(buildDir, "generated/assets/react/$targetPath")
  // Sourcemap: generated/sourcemaps/react/path/index.android.bundle.map
  val jsSourceMapsDir = File(buildDir, "generated/sourcemaps/react/$targetPath")
  // Intermediate packager: intermediates/sourcemaps/react/path/index.android.bundle.packager.map
  // Intermediate compiler: intermediates/sourcemaps/react/path/index.android.bundle.compiler.map
  val jsIntermediateSourceMapsDir = File(buildDir, "intermediates/sourcemaps/react/$targetPath")

  // The location of the cli.js file for React Native
  val cliFile = detectedCliFile(config)

  val isHermesEnabledInProject = project.isHermesEnabled
  val isHermesEnabledInThisVariant =
      if (config.enableHermesOnlyInVariants.get().isNotEmpty()) {
        config.enableHermesOnlyInVariants.get().contains(variant.name) && isHermesEnabledInProject
      } else {
        isHermesEnabledInProject
      }
  val isDebuggableVariant =
      config.debuggableVariants.get().any { it.equals(variant.name, ignoreCase = true) }

  configureNewArchPackagingOptions(project, variant)
  configureJsEnginePackagingOptions(config, variant, isHermesEnabledInThisVariant)

  if (!isDebuggableVariant) {
    val bundleTask =
        tasks.register("createBundle${targetName}JsAndAssets", BundleHermesCTask::class.java) {
          it.root.set(config.root)
          it.nodeExecutableAndArgs.set(config.nodeExecutableAndArgs)
          it.cliFile.set(cliFile)
          it.bundleCommand.set(config.bundleCommand)
          it.entryFile.set(detectedEntryFile(config))
          it.extraPackagerArgs.set(config.extraPackagerArgs)
          it.bundleConfig.set(config.bundleConfig)
          it.bundleAssetName.set(config.bundleAssetName)
          it.jsBundleDir.set(jsBundleDir)
          it.resourcesDir.set(resourcesDir)
          it.hermesEnabled.set(isHermesEnabledInThisVariant)
          it.minifyEnabled.set(!isHermesEnabledInThisVariant)
          it.devEnabled.set(false)
          it.jsIntermediateSourceMapsDir.set(jsIntermediateSourceMapsDir)
          it.jsSourceMapsDir.set(jsSourceMapsDir)
          it.hermesCommand.set(config.hermesCommand)
          it.hermesFlags.set(config.hermesFlags)
          it.reactNativeDir.set(config.reactNativeDir)
        }
    variant.sources.res?.addGeneratedSourceDirectory(bundleTask, BundleHermesCTask::resourcesDir)
    variant.sources.assets?.addGeneratedSourceDirectory(bundleTask, BundleHermesCTask::jsBundleDir)
  }
}
