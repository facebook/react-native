/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks.internal

import com.facebook.react.utils.Os.unixifyPath
import com.facebook.react.utils.windowsAwareBashCommandLine
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.file.FileTree
import org.gradle.api.provider.Property
import org.gradle.api.tasks.*

/**
 * A Task that will call the `scripts/oss/build.sh` script to trigger the creation of the codegen
 * lib artifacts.
 *
 * NOTE: This task is required when using react-native-codegen from source, instead of npm.
 */
abstract class BuildCodegenCLITask : Exec() {

  @get:Internal abstract val codegenDir: DirectoryProperty

  @get:Internal abstract val bashWindowsHome: Property<String>

  @get:InputFiles
  val inputFiles: FileTree = project.fileTree(codegenDir) { it.include("src/**/*.js") }

  @get:OutputFiles
  val outputFiles: FileTree =
      project.fileTree(codegenDir) {
        it.include("lib/**/*.js")
        it.include("lib/**/*.js.flow")
      }

  override fun exec() {
    commandLine(
        windowsAwareBashCommandLine(
            codegenDir.asFile.get().canonicalPath.unixifyPath().plus(BUILD_SCRIPT_PATH),
            bashWindowsHome = bashWindowsHome.orNull,
        ))
    super.exec()
  }

  companion object {
    private const val BUILD_SCRIPT_PATH = "/scripts/oss/build.sh"
  }
}
