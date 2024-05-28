/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.utils.windowsAwareCommandLine
import java.io.FileOutputStream
import org.gradle.api.file.FileCollection
import org.gradle.api.file.RegularFileProperty
import org.gradle.api.provider.ListProperty
import org.gradle.api.provider.Property
import org.gradle.api.tasks.*

/**
 * A task that will run @react-native-community/cli config if necessary to generate the autolinking
 * configuration file.
 */
abstract class RunAutolinkingConfigTask : Exec() {

  init {
    group = "react"
  }

  @get:Input abstract val autolinkConfigCommand: ListProperty<String>

  /*
   * We don't want to re-run config if the lockfiles haven't changed.
   * So we have the lockfiles as @InputFiles for this task.
   */
  @get:InputFiles abstract val autolinkLockFiles: Property<FileCollection>

  @get:InputFile @get:Optional abstract val autolinkConfigFile: RegularFileProperty

  @get:OutputFile abstract val autolinkOutputFile: RegularFileProperty

  override fun exec() {
    wipeOutputDir()
    setupCommandLine()
    super.exec()
  }

  internal fun setupCommandLine() {
    if (!autolinkConfigFile.isPresent || !autolinkConfigFile.get().asFile.exists()) {
      setupConfigCommandLine()
    } else {
      setupConfigCopyCommandLine()
    }
  }

  internal fun wipeOutputDir() {
    autolinkOutputFile.asFile.get().apply {
      deleteRecursively()
      parentFile.mkdirs()
    }
  }

  internal fun setupConfigCommandLine() {
    workingDir(project.projectDir)
    standardOutput = FileOutputStream(autolinkOutputFile.get().asFile)
    commandLine(
        windowsAwareCommandLine(
            *autolinkConfigCommand.get().toTypedArray(),
        ))
  }

  internal fun setupConfigCopyCommandLine() {
    workingDir(project.projectDir)
    commandLine(
        windowsAwareCommandLine(
            "cp",
            autolinkConfigFile.get().asFile.absolutePath,
            autolinkOutputFile.get().asFile.absolutePath))
  }
}
