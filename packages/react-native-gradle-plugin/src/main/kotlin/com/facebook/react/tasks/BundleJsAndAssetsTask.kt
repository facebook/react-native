/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import org.gradle.api.DefaultTask
import org.gradle.api.file.FileTree
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.InputFiles
import org.gradle.api.tasks.OutputDirectory
import org.gradle.api.tasks.OutputFile
import org.gradle.api.tasks.TaskAction
import java.io.File

open class BundleJsAndAssetsTask : DefaultTask() {
  internal lateinit var reactRoot: File

  @get:InputFiles
  @Suppress("UNUSED") // used to invalidate caches
  internal lateinit var sources: FileTree
  @get:Input
  internal lateinit var execCommand: List<String>
  @get:Input
  internal lateinit var bundleCommand: String
  @get:Input
  internal var devEnabled: Boolean = true
  @get:Input
  internal lateinit var entryFile: File
  @get:Input
  internal var extraArgs: List<String> = emptyList()

  @get:OutputDirectory
  internal lateinit var jsBundleDir: File
  @get:OutputFile
  internal lateinit var jsBundleFile: File
  @get:OutputDirectory
  internal lateinit var resourcesDir: File
  @get:OutputDirectory
  internal lateinit var jsIntermediateSourceMapsDir: File
  @get:OutputDirectory
  internal lateinit var jsSourceMapsDir: File
  @get:OutputFile
  internal lateinit var jsSourceMapsFile: File

  @TaskAction
  fun run() {
    cleanOutputDirectories()
    executeBundleCommand()
  }

  private fun cleanOutputDirectories() {
    jsBundleDir.recreateDir()
    resourcesDir.recreateDir()
    jsIntermediateSourceMapsDir.recreateDir()
    jsSourceMapsDir.recreateDir()
  }

  private fun executeBundleCommand() {
    project.exec {
      workingDir(reactRoot)

      @Suppress("SpreadOperator")
      windowsAwareCommandLine(
        *execCommand.toTypedArray(),
        bundleCommand,
        "--platform", "android",
        "--dev", devEnabled,
        "--reset-cache",
        "--entry-file", entryFile,
        "--bundle-output", jsBundleFile,
        "--assets-dest", resourcesDir,
        "--sourcemap-output", jsSourceMapsFile,
        *extraArgs.toTypedArray()
      )
    }
  }

  private fun File.recreateDir() {
    deleteRecursively()
    mkdirs()
  }
}
