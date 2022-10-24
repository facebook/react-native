/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.android.build.api.artifact.SingleArtifact
import com.android.build.api.variant.Variant
import com.facebook.react.tasks.BundleHermesCTask
import com.facebook.react.tasks.NativeLibraryAabCleanupTask
import com.facebook.react.tasks.NativeLibraryApkCleanupTask
import com.facebook.react.utils.ProjectUtils.isHermesEnabled
import com.facebook.react.utils.detectedCliPath
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

  // Additional node and packager commandline arguments
  val cliPath = detectedCliPath(project.projectDir, config)

  val enableHermesInProject = project.isHermesEnabled
  val enableHermesInThisVariant =
      if (config.enableHermesOnlyInVariants.get().isNotEmpty()) {
        config.enableHermesOnlyInVariants.get().contains(variant.name) && enableHermesInProject
      } else {
        enableHermesInProject
      }
  val isDebuggableVariant =
      config.debuggableVariants.get().any { it.equals(variant.name, ignoreCase = true) }

  if (!isDebuggableVariant) {
    val bundleTask =
        tasks.register("createBundle${targetName}JsAndAssets", BundleHermesCTask::class.java) {
          it.root.set(config.root)
          it.nodeExecutableAndArgs.set(config.nodeExecutableAndArgs)
          it.cliPath.set(cliPath)
          it.bundleCommand.set(config.bundleCommand)
          it.entryFile.set(detectedEntryFile(config))
          it.extraPackagerArgs.set(config.extraPackagerArgs)
          it.bundleConfig.set(config.bundleConfig)
          it.bundleAssetName.set(config.bundleAssetName)
          it.jsBundleDir.set(jsBundleDir)
          it.resourcesDir.set(resourcesDir)
          it.hermesEnabled.set(enableHermesInThisVariant)
          it.minifyEnabled.set(!enableHermesInThisVariant)
          it.devEnabled.set(false)
          it.jsIntermediateSourceMapsDir.set(jsIntermediateSourceMapsDir)
          it.jsSourceMapsDir.set(jsSourceMapsDir)
          it.hermesCommand.set(config.hermesCommand)
          it.hermesFlags.set(config.hermesFlags)
          it.composeSourceMapsPath.set(config.composeSourceMapsPath)
        }
    variant.sources.res?.addGeneratedSourceDirectory(bundleTask, BundleHermesCTask::resourcesDir)
    variant.sources.assets?.addGeneratedSourceDirectory(bundleTask, BundleHermesCTask::jsBundleDir)
  }

  if (config.enableSoCleanup.get()) {
    val nativeLibraryApkCleanupTask =
        project.tasks.register(
            "nativeLibrary${targetName}ApkCleanup", NativeLibraryApkCleanupTask::class.java) {
              it.debuggableVariant.set(isDebuggableVariant)
              it.enableHermes.set(enableHermesInThisVariant)
            }
    val nativeLibraryBundleCleanupTask =
        project.tasks.register(
            "nativeLibrary${targetName}BundleCleanup", NativeLibraryAabCleanupTask::class.java) {
              it.debuggableVariant.set(isDebuggableVariant)
              it.enableHermes.set(enableHermesInThisVariant)
            }

    variant.artifacts
        .use(nativeLibraryApkCleanupTask)
        .wiredWithDirectories(
            NativeLibraryApkCleanupTask::inputApkDirectory,
            NativeLibraryApkCleanupTask::outputApkDirectory)
        .toTransform(SingleArtifact.APK)
    variant.artifacts
        .use(nativeLibraryBundleCleanupTask)
        .wiredWithFiles(
            NativeLibraryAabCleanupTask::inputBundle, NativeLibraryAabCleanupTask::outputBundle)
        .toTransform(SingleArtifact.BUNDLE)
  }
}
