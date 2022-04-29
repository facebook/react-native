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
import com.facebook.react.utils.detectedCliPath
import com.facebook.react.utils.detectedEntryFile
import com.facebook.react.utils.detectedHermesCommand
import java.io.File
import java.util.*
import org.gradle.api.Project
import org.gradle.api.tasks.Copy

private const val REACT_GROUP = "react"

@Suppress("SpreadOperator")
internal fun Project.configureReactTasks(variant: BaseVariant, config: ReactAppExtension) {
  val targetName = variant.name.capitalize(Locale.ROOT)
  val isRelease = variant.isRelease
  val targetPath = variant.dirName

  // React js bundle directories
  val jsBundleDir = File(buildDir, "generated/assets/react/$targetPath")
  val resourcesDir = File(buildDir, "generated/res/react/$targetPath")

  val bundleAssetName = config.bundleAssetName.get()
  val jsBundleFile = File(jsBundleDir, bundleAssetName)
  val jsSourceMapsDir = File(buildDir, "generated/sourcemaps/react/$targetPath")
  val jsIntermediateSourceMapsDir = File(buildDir, "intermediates/sourcemaps/react/$targetPath")
  val jsPackagerSourceMapFile = File(jsIntermediateSourceMapsDir, "${bundleAssetName}.packager.map")
  val jsCompilerSourceMapFile = File(jsIntermediateSourceMapsDir, "${bundleAssetName}.compiler.map")
  val jsOutputSourceMapFile = File(jsSourceMapsDir, "${bundleAssetName}.map")

  // Additional node and packager commandline arguments
  val nodeExecutableAndArgs = config.nodeExecutableAndArgs.get()
  val cliPath = detectedCliPath(project.projectDir, config)

  val execCommand = nodeExecutableAndArgs + cliPath
  val enableHermes = config.enableHermesForVariant(variant)
  val bundleEnabled = variant.checkBundleEnabled(config)

  val bundleTask =
      tasks.register("createBundle${targetName}JsAndAssets", BundleJsAndAssetsTask::class.java) {
        it.group = REACT_GROUP
        it.description = "create JS bundle and assets for $targetName."

        it.reactRoot = config.reactRoot.get().asFile
        it.sources =
            fileTree(config.reactRoot) { fileTree ->
              fileTree.setExcludes(config.inputExcludes.get())
            }
        it.execCommand = execCommand
        it.bundleCommand = config.bundleCommand.get()
        it.devEnabled = !(variant.name in config.devDisabledInVariants.get() || isRelease)
        it.entryFile = detectedEntryFile(config)

        val extraArgs = mutableListOf<String>()

        if (config.bundleConfig.isPresent) {
          extraArgs.add("--config")
          extraArgs.add(config.bundleConfig.get())
        }

        // Hermes doesn't require JS minification.
        if (enableHermes && !it.devEnabled) {
          extraArgs.add("--minify")
          extraArgs.add("false")
        }

        extraArgs.addAll(config.extraPackagerArgs.get())

        it.extraArgs = extraArgs

        it.jsBundleDir = jsBundleDir
        it.jsBundleFile = jsBundleFile
        it.resourcesDir = resourcesDir
        it.jsIntermediateSourceMapsDir = jsIntermediateSourceMapsDir
        it.jsSourceMapsDir = jsSourceMapsDir
        it.jsSourceMapsFile = if (enableHermes) jsPackagerSourceMapFile else jsOutputSourceMapFile

        it.enabled = bundleEnabled
      }

  val hermesTask =
      tasks.register("emit${targetName}HermesResources", HermesBinaryTask::class.java) {
        it.group = REACT_GROUP
        it.description = "bundle hermes resources for $targetName"

        it.reactRoot = config.reactRoot.get().asFile
        it.hermesCommand = detectedHermesCommand(config)
        it.hermesFlags =
            if (isRelease) config.hermesFlagsRelease.get() else config.hermesFlagsDebug.get()
        it.jsBundleFile = jsBundleFile
        it.composeSourceMapsCommand = nodeExecutableAndArgs + config.composeSourceMapsPath.get()
        it.jsPackagerSourceMapFile = jsPackagerSourceMapFile
        it.jsCompilerSourceMapFile = jsCompilerSourceMapFile
        it.jsOutputSourceMapFile = jsOutputSourceMapFile

        it.dependsOn(bundleTask)

        it.enabled = bundleEnabled && enableHermes
      }

  val aggregatedBundleTask =
      tasks.register("bundle${targetName}JsAndAssets") {
        it.group = REACT_GROUP
        it.description = "bundle JS and resources for $targetName"

        it.dependsOn(bundleTask, hermesTask)

        // this was exposed before, do we still need it?
        it.extensions.extraProperties["generatedResFolders"] = files(resourcesDir).builtBy(it)
        it.extensions.extraProperties["generatedAssetsFolders"] = files(jsBundleDir).builtBy(it)
      }

  val generatedResFolders = files(resourcesDir).builtBy(aggregatedBundleTask)

  // Android configuration
  variant.registerGeneratedResFolders(generatedResFolders)

  val packageTask =
      when (variant) {
        is ApplicationVariant -> variant.packageApplicationProvider
        is LibraryVariant -> variant.packageLibraryProvider
        else -> tasks.named("package$targetName")
      }

  val mergeResourcesTask = variant.mergeResourcesProvider
  val mergeAssetsTask = variant.mergeAssetsProvider
  val preBundleTask = tasks.named("build${targetName}PreBundle")

  val resourcesDirConfigValue = config.resourcesDir.getting(variant.name)
  if (resourcesDirConfigValue.isPresent) {
    val currentCopyResTask =
        tasks.register("copy${targetName}BundledResources", Copy::class.java) {
          it.group = "react"
          it.description = "copy bundled resources into custom location for $targetName."

          it.from(resourcesDir)
          it.into(file(resourcesDirConfigValue.get()))

          it.dependsOn(bundleTask)

          it.enabled = bundleEnabled
        }

    packageTask.dependsOn(currentCopyResTask)
    preBundleTask.dependsOn(currentCopyResTask)
  }

  packageTask.configure {
    if (config.enableVmCleanup.get()) {
      it.doFirst { cleanupVMFiles(enableHermes, isRelease, targetPath) }
    }
  }

  val currentAssetsCopyTask =
      tasks.register("copy${targetName}BundledJs", Copy::class.java) {
        it.group = "react"
        it.description = "copy bundled JS into $targetName."

        it.from(jsBundleDir)

        val jsBundleDirConfigValue = config.jsBundleDir.getting(targetName)
        if (jsBundleDirConfigValue.isPresent) {
          it.into(jsBundleDirConfigValue.get())
        } else {
          it.into(mergeAssetsTask.map { mergeFoldersTask -> mergeFoldersTask.outputDir.get() })
        }

        it.dependsOn(mergeAssetsTask)

        it.enabled = bundleEnabled
      }

  // mergeResources task runs before the bundle file is copied to the intermediate asset directory
  // from Android plugin 4.1+.
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
      it.include("**/libjsc*.so")

      if (isRelease) {
        // Reduce size by deleting the debugger/inspector
        it.include("**/libhermes-inspector.so")
        it.include("**/libhermes-executor-debug.so")
      } else {
        // Release libs take precedence and must be removed
        // to allow debugging
        it.include("**/libhermes-executor-release.so")
      }
    } else {
      // For JSC, delete all the libhermes* files
      it.include("**/libhermes*.so")
    }
  }
      .visit { visit ->
        val targetVariant = ".*/transforms/[^/]*/$targetPath/.*".toRegex()
        val path = visit.file.absolutePath.replace(File.separatorChar, '/')
        if (path.matches(targetVariant) && visit.file.isFile) {
          visit.file.delete()
        }
      }
}

private fun BaseVariant.checkBundleEnabled(config: ReactAppExtension): Boolean {
  if (config.bundleIn.getting(name).isPresent) {
    return config.bundleIn.getting(name).get()
  }

  if (config.bundleIn.getting(buildType.name).isPresent) {
    return config.bundleIn.getting(buildType.name).get()
  }

  return isRelease
}

private val BaseVariant.isRelease: Boolean
  get() = name.toLowerCase(Locale.ROOT).contains("release")
