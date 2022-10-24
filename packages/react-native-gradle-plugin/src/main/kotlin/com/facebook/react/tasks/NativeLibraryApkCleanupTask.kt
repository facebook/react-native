/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.utils.SoCleanerUtils
import org.gradle.api.DefaultTask
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.provider.Property
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.InputDirectory
import org.gradle.api.tasks.OutputDirectory
import org.gradle.api.tasks.TaskAction

abstract class NativeLibraryApkCleanupTask : DefaultTask() {

  @get:InputDirectory abstract val inputApkDirectory: DirectoryProperty

  @get:OutputDirectory abstract val outputApkDirectory: DirectoryProperty

  @get:Input abstract val enableHermes: Property<Boolean>

  @get:Input abstract val debuggableVariant: Property<Boolean>

  @TaskAction
  fun run() {
    inputApkDirectory.get().asFile.walk().forEach {
      if (it.name.endsWith(".apk")) {
        SoCleanerUtils.clean(
            input = it,
            prefix = "lib/",
            enableHermes = enableHermes.get(),
            debuggableVariant = debuggableVariant.get())
      }
    }
  }
}
