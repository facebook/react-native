/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks.internal

import java.io.File
import java.io.FileOutputStream
import org.gradle.api.file.RegularFileProperty
import org.gradle.api.provider.Property
import org.gradle.api.tasks.Exec
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.Optional
import org.gradle.api.tasks.OutputFile

/**
 * A Task that will just expose an Exec-like task and that offers properties to configure the
 * standard output and error.
 */
abstract class CustomExecTask : Exec() {

  @get:OutputFile @get:Optional abstract val standardOutputFile: RegularFileProperty

  @get:OutputFile @get:Optional abstract val errorOutputFile: RegularFileProperty

  @get:Input @get:Optional abstract val onlyIfProvidedPathDoesNotExists: Property<String>

  override fun exec() {
    if (
        onlyIfProvidedPathDoesNotExists.isPresent &&
            File(onlyIfProvidedPathDoesNotExists.get()).exists()
    ) {
      return
    }
    if (standardOutputFile.isPresent) {
      standardOutput = FileOutputStream(standardOutputFile.get().asFile)
    }
    if (errorOutputFile.isPresent) {
      errorOutput = FileOutputStream(errorOutputFile.get().asFile)
    }
    super.exec()
  }
}
