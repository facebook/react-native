/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.utils.SoCleanerUtils
import org.gradle.api.DefaultTask
import org.gradle.api.file.RegularFileProperty
import org.gradle.api.provider.Property
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.InputFile
import org.gradle.api.tasks.OutputFile
import org.gradle.api.tasks.TaskAction

abstract class NativeLibraryAabCleanupTask : DefaultTask() {

  @get:InputFile abstract val inputBundle: RegularFileProperty

  @get:OutputFile abstract val outputBundle: RegularFileProperty

  @get:Input abstract val enableHermes: Property<Boolean>

  @get:Input abstract val debuggableVariant: Property<Boolean>

  @TaskAction
  fun run() {
    val inputBundleFile = inputBundle.get().asFile
    val outputBundleFile = outputBundle.get().asFile
    SoCleanerUtils.clean(
        input = inputBundleFile,
        prefix = "base/lib",
        enableHermes = enableHermes.get(),
        debuggableVariant = debuggableVariant.get())
    inputBundleFile.copyTo(outputBundleFile, overwrite = true)
  }
}
