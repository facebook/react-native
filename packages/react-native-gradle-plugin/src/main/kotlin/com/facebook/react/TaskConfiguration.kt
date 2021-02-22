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
import com.facebook.react.tasks.windowsAwareCommandLine
import org.gradle.api.Action
import org.gradle.api.Project
import org.gradle.api.Task
import org.gradle.api.tasks.Copy
import org.gradle.api.tasks.Exec
import org.gradle.kotlin.dsl.withGroovyBuilder
import org.gradle.kotlin.dsl.create
import java.io.File

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
  val nodeExecutableAndArgs = config.nodeExecutableAndArgs.toTypedArray()
  val cliPath = config.detectedCliPath

  val execCommand = nodeExecutableAndArgs + cliPath
  val enableHermes = config.enableHermesForVariant(variant)
  val bundleEnabled = variant.checkBundleEnabled(config)

  val currentBundleTask = tasks.create<Exec>("bundle${targetName}JsAndAssets") {
    group = "react"
    description = "bundle JS and assets for $targetName."

    // Create dirs if they are not there (e.g. the "clean" task just ran)
    doFirst {
      jsBundleDir.deleteRecursively()
      jsBundleDir.mkdirs()
      resourcesDir.deleteRecursively()
      resourcesDir.mkdirs()
      jsIntermediateSourceMapsDir.deleteRecursively()
      jsIntermediateSourceMapsDir.mkdirs()
      jsSourceMapsDir.deleteRecursively()
      jsSourceMapsDir.mkdirs()
    }

    // Set up inputs and outputs so gradle can cache the result
    inputs.files(
      fileTree(config.reactRoot) {
        setExcludes(config.inputExcludes)
      }
    )
    outputs.dir(jsBundleDir)
    outputs.dir(resourcesDir)

    // Set up the call to the react-native cli
    workingDir(config.reactRoot)

    // Set up dev mode
    val devEnabled = !(variant.name in config.devDisabledInVariants || variant.isRelease)

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

    windowsAwareCommandLine(
      *execCommand,
      config.bundleCommand,
      "--platform", "android",
      "--dev", "$devEnabled",
      "--reset-cache",
      "--entry-file", config.detectedEntryFile,
      "--bundle-output", jsBundleFile,
      "--assets-dest", resourcesDir,
      "--sourcemap-output", if (enableHermes) jsPackagerSourceMapFile else jsOutputSourceMapFile,
      *extraArgs.toTypedArray()
    )

    if (enableHermes) {
      doLast {
        val hermesFlags = if (isRelease) {
          config.hermesFlagsRelease
        } else {
          config.hermesFlagsDebug
        }.toTypedArray()

        val hbcTempFile = file("$jsBundleFile.hbc")
        exec {
          windowsAwareCommandLine(
            config.osAwareHermesCommand,
            "-emit-binary",
            "-out", hbcTempFile, jsBundleFile,
            *hermesFlags
          )
        }
        ant.withGroovyBuilder {
          "move"(
              "file" to hbcTempFile,
              "toFile" to jsBundleFile
          )
        }
        if (hermesFlags.contains("-output-source-map")) {
          ant.withGroovyBuilder {
            "move"(
              "file" to "$jsBundleFile.hbc.map",
              "toFile" to jsCompilerSourceMapFile
            )
          }
          exec {
            // TODO: set task dependencies for caching

            // Set up the call to the compose-source-maps script
            workingDir(config.reactRoot)
            windowsAwareCommandLine(
              *nodeExecutableAndArgs,
              config.composeSourceMapsPath,
              jsPackagerSourceMapFile,
              jsCompilerSourceMapFile,
              "-o", jsOutputSourceMapFile)
            }
          }
        }
      }

    enabled = bundleEnabled
  }

  // todo expose bundle task and its generated folders
  val generatedResFolders = files(resourcesDir).builtBy(currentBundleTask)
//  val generatedAssetsFolders = files(jsBundleDir).builtBy(currentBundleTask)

  variant.registerGeneratedResFolders(generatedResFolders)
  variant.mergeResourcesProvider.get().dependsOn(currentBundleTask)

  val packageTask = when (variant) {
    is ApplicationVariant -> variant.packageApplicationProvider.get()
    is LibraryVariant -> variant.packageLibraryProvider.get()
    else -> tasks.findByName("package$targetName")!!
  }

  // pre bundle build task for Android plugin 3.2+
  val buildPreBundleTask = tasks.findByName("build${targetName}PreBundle")

  val resourcesDirConfigValue = config.resourcesDir[variant.name]
  if (resourcesDirConfigValue != null) {
    val currentCopyResTask = tasks.create<Copy>("copy${targetName}BundledResources") {
      group = "react"
      description = "copy bundled resources into custom location for $targetName."

      from(resourcesDir)
      into(file(resourcesDirConfigValue))

      dependsOn(currentBundleTask)

      enabled = currentBundleTask.enabled
    }

    packageTask.dependsOn(currentCopyResTask)
    buildPreBundleTask?.dependsOn(currentCopyResTask)
  }

  val currentAssetsCopyTask = tasks.create<Copy>("copy${targetName}BundledJs") {
    group = "react"
    description = "copy bundled JS into $targetName."

    val jsBundleDirConfigValue = config.jsBundleDir[targetName]
    if (jsBundleDirConfigValue != null) {
      from(jsBundleDir)
      into(jsBundleDirConfigValue)
    } else {
      into("$buildDir/intermediates")
      into("assets/$targetPath") {
        from(jsBundleDir)
      }

      // Workaround for Android Gradle Plugin 3.2+ new asset directory
      into("merged_assets/${variant.name}/merge${targetName}Assets/out") {
        from(jsBundleDir)
      }

      // Workaround for Android Gradle Plugin 3.4+ new asset directory
      into("merged_assets/${variant.name}/out") {
        from(jsBundleDir)
      }
    }

    // mergeAssets must run first, as it clears the intermediates directory
    dependsOn(variant.mergeAssetsProvider.get())

    enabled = currentBundleTask.enabled
  }

  // mergeResources task runs before the bundle file is copied to the intermediate asset directory from Android plugin 4.1+.
  // This ensures to copy the bundle file before mergeResources task starts
  val mergeResourcesTask = tasks.findByName("merge${targetName}Resources")
  mergeResourcesTask?.dependsOn(currentAssetsCopyTask)

  packageTask.dependsOn(currentAssetsCopyTask)
  buildPreBundleTask?.dependsOn(currentAssetsCopyTask)

  // Delete the VM related libraries that this build doesn't need.
  // The application can manage this manually by setting 'enableVmCleanup: false'
  //
  // This should really be done by packaging all Hermes related libs into
  // two separate HermesDebug and HermesRelease AARs, but until then we'll
  // kludge it by deleting the .so files out of the /transforms/ directory.
  val libDir = "$buildDir/intermediates/transforms/"
  val vmSelectionAction = Action<Task> {
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

  if (config.enableVmCleanup) {
    val task = tasks.findByName("package$targetName")
    task?.doFirst(vmSelectionAction)
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
