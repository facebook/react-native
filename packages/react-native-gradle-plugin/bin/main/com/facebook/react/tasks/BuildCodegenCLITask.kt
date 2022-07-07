/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.utils.Os.unixifyPath
import com.facebook.react.utils.windowsAwareBashCommandLine
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.file.FileCollection
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
  val input: FileCollection by lazy {
    codegenDir.get().files("scripts", "src", "package.json", ".babelrc", ".prettierrc")
  }

  @get:OutputDirectories
  val output: FileCollection by lazy { codegenDir.get().files("lib", "node_modules") }

  init {
    // We need this condition as we want a single instance of BuildCodegenCLITask to execute
    // per project. Therefore we can safely skip the task if the lib/cli/ folder is available.
    onlyIf {
      val cliDir = codegenDir.file("lib/cli/").get().asFile
      !cliDir.exists() || cliDir.listFiles()?.size == 0
    }
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
