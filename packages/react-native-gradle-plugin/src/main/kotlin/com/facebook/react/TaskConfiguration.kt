/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.android.build.gradle.api.ApplicationVariant
import com.android.build.gradle.api.BaseVariant
import com.android.build.gradle.api.LibraryVariant
import com.android.build.gradle.internal.tasks.factory.dependsOn
import com.facebook.react.tasks.BundleJsAndAssetsTask
import com.facebook.react.tasks.HermesBinaryTask
import org.gradle.api.Project
import org.gradle.api.tasks.Copy
import org.gradle.kotlin.dsl.extra
import org.gradle.kotlin.dsl.register
import java.io.File

private const val REACT_GROUP = "react"

@Suppress("SpreadOperator")
internal fun Project.configureReactTasks(variant: BaseVariant, config: ReactAppExtension) {
  val targetName = variant.name.capitalize()
  val isRelease = variant.isRelease
  val targetPath = variant.dirName

  // React js bundle directories
  val jsBundleDir = File(buildDir, "generated/assets/react/$targetPath")
  val resourcesDir = File(buildDir, "generated/res/react/$targetPath")

  val jsBundleFile = File(jsBundleDir, config.bundleAssetName)
  val jsSourceMapsDir = File(buildDir, "generated/sourcemaps/react/$targetPath")
  val jsIntermediateSourceMapsDir = File(buildDir, "intermediates/sourcemaps/react/$targetPath")
  val jsPackagerSourceMapFile = File(jsIntermediateSourceMapsDir, "${config.bundleAssetName}.packager.map")
  val jsCompilerSourceMapFile = File(jsIntermediateSourceMapsDir, "${config.bundleAssetName}.compiler.map")
  val jsOutputSourceMapFile = File(jsSourceMapsDir, "${config.bundleAssetName}.map")

  // Additional node and packager commandline arguments
  val nodeExecutableAndArgs = config.nodeExecutableAndArgs
  val cliPath = config.detectedCliPath

  val execCommand = nodeExecutableAndArgs + cliPath
  val enableHermes = config.enableHermesForVariant(variant)
  val bundleEnabled = variant.checkBundleEnabled(config)

  val bundleTask = tasks.register<BundleJsAndAssetsTask>("createBundle${targetName}JsAndAssets") {
    val task = this
    task.group = REACT_GROUP
    task.description = "create JS bundle and assets for $targetName."

    task.reactRoot = config.reactRoot
    task.sources = fileTree(config.reactRoot) {
      setExcludes(config.inputExcludes)
    }
    task.execCommand = execCommand
    task.bundleCommand = config.bundleCommand
    task.devEnabled = !(variant.name in config.devDisabledInVariants || isRelease)
    task.entryFile = config.detectedEntryFile

    val extraArgs = mutableListOf<String>()

    if (config.bundleConfig != null) {
      extraArgs.add("--config")
      extraArgs.add(config.bundleConfig.orEmpty())
    }

    // Hermes doesn't require JS minification.
    if (enableHermes && !devEnabled) {
      extraArgs.add("--minify")
      extraArgs.add("false")
    }

    extraArgs.addAll(config.extraPackagerArgs)

    task.extraArgs = emptyList()

    task.jsBundleDir = jsBundleDir
    task.jsBundleFile = jsBundleFile
    task.resourcesDir = resourcesDir
    task.jsIntermediateSourceMapsDir = jsIntermediateSourceMapsDir
    task.jsSourceMapsDir = jsSourceMapsDir
    task.jsSourceMapsFile = if (enableHermes) jsPackagerSourceMapFile else jsOutputSourceMapFile

    task.enabled = bundleEnabled
  }

  val hermesTask = tasks.register<HermesBinaryTask>("emit${targetName}HermesResources") {
    val task = this
    task.group = REACT_GROUP
    task.description = "bundle hermes resources for $targetName"

    task.reactRoot = config.reactRoot
    task.hermesCommand = config.osAwareHermesCommand
    task.hermesFlags = if (isRelease) config.hermesFlagsRelease else config.hermesFlagsDebug
    task.jsBundleFile = jsBundleFile
    task.composeSourceMapsCommand = nodeExecutableAndArgs + config.composeSourceMapsPath
    task.jsPackagerSourceMapFile = jsPackagerSourceMapFile
    task.jsCompilerSourceMapFile = jsCompilerSourceMapFile
    task.jsOutputSourceMapFile = jsOutputSourceMapFile

    task.dependsOn(bundleTask)

    task.enabled = bundleEnabled && enableHermes
  }

  val aggregatedBundleTask = tasks.register("bundle${targetName}JsAndAssets") {
    val task = this
    task.group = REACT_GROUP
    task.description = "bundle JS and resources for $targetName"

    task.dependsOn(bundleTask, hermesTask)

    // this was exposed before, do we still need it?
    task.extra["generatedResFolders"] = files(resourcesDir).builtBy(task)
    task.extra["generatedAssetsFolders"] = files(jsBundleDir).builtBy(task)
  }

  val generatedResFolders = files(resourcesDir).builtBy(aggregatedBundleTask)

  // Android configuration
  variant.registerGeneratedResFolders(generatedResFolders)

  val packageTask = when (variant) {
    is ApplicationVariant -> variant.packageApplicationProvider
    is LibraryVariant -> variant.packageLibraryProvider
    else -> tasks.named("package$targetName")
  }

  val mergeResourcesTask = variant.mergeResourcesProvider
  val mergeAssetsTask = variant.mergeAssetsProvider
  val preBundleTask = tasks.named("build${targetName}PreBundle")

  val resourcesDirConfigValue = config.resourcesDir[variant.name]
  if (resourcesDirConfigValue != null) {
    val currentCopyResTask = tasks.register<Copy>("copy${targetName}BundledResources") {
      group = "react"
      description = "copy bundled resources into custom location for $targetName."

      from(resourcesDir)
      into(file(resourcesDirConfigValue))

      dependsOn(bundleTask)

      enabled = bundleEnabled
    }

    packageTask.dependsOn(currentCopyResTask)
    preBundleTask.dependsOn(currentCopyResTask)
  }

  packageTask.configure {
    if (config.enableVmCleanup) {
      doFirst {
        cleanupVMFiles(enableHermes, isRelease, targetPath)
      }
    }
  }

  val currentAssetsCopyTask = tasks.register<Copy>("copy${targetName}BundledJs") {
    group = "react"
    description = "copy bundled JS into $targetName."

    from(jsBundleDir)

    val jsBundleDirConfigValue = config.jsBundleDir[targetName]
    if (jsBundleDirConfigValue != null) {
      into(jsBundleDirConfigValue)
    } else {
      into(mergeAssetsTask.map { it.outputDir.get() })
    }

    dependsOn(mergeAssetsTask)

    enabled = bundleEnabled
  }

  // mergeResources task runs before the bundle file is copied to the intermediate asset directory from Android plugin 4.1+.
  // This ensures to copy the bundle file before mergeResources task starts
  mergeResourcesTask.dependsOn(currentAssetsCopyTask)
  packageTask.dependsOn(currentAssetsCopyTask)
  preBundleTask.dependsOn(currentAssetsCopyTask)
}

private fun Project.cleanupVMFiles(enableHermes: Boolean, isRelease: Boolean, targetPath: String) {
  // Delete the VM related libraries that this build doesn't need.
  // The application can manage this manually by setting 'enableVmCleanup: false'
  //
  // This should really be done by packaging all Hermes related libs into
  // two separate HermesDebug and HermesRelease AARs, but until then we'll
  // kludge it by deleting the .so files out of the /transforms/ directory.
  val libDir = "$buildDir/intermediates/transforms/"
  fileTree(libDir) {
    if (enableHermes) {
      // For Hermes, delete all the libjsc* files
      include("**/libjsc*.so")

      if (isRelease) {
        // Reduce size by deleting the debugger/inspector
        include("**/libhermes-inspector.so")
        include("**/libhermes-executor-debug.so")
      } else {
        // Release libs take precedence and must be removed
        // to allow debugging
        include("**/libhermes-executor-release.so")
      }
    } else {
      // For JSC, delete all the libhermes* files
      include("**/libhermes*.so")
    }
  }.visit {
    val targetVariant = ".*/transforms/[^/]*/$targetPath/.*".toRegex()
    val path = file.absolutePath.replace(File.separatorChar, '/')
    if (path.matches(targetVariant) && file.isFile()) {
      file.delete()
    }
  }
}

private fun BaseVariant.checkBundleEnabled(config: ReactAppExtension): Boolean {
  if (name in config.bundleIn) {
    return config.bundleIn.getValue(name)
  }

  if (buildType.name in config.bundleIn) {
    return config.bundleIn.getValue(buildType.name)
  }

  return isRelease
}

private val BaseVariant.isRelease: Boolean
  get() = name.toLowerCase().contains("release")
