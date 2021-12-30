/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks.internal

import org.gradle.api.DefaultTask
import org.gradle.api.file.ConfigurableFileCollection
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.tasks.*

/**
 * A task that takes care of extracting JNIs and Headers from a custom Gradle configuration into an
 * output folder. Users are most likely not going to use this task but it will be used when building
 * the React Native project.
 */
abstract class ExtractJniAndHeadersTask : DefaultTask() {

  @get:InputFiles abstract val extractHeadersConfiguration: ConfigurableFileCollection

  @get:InputFiles abstract val extractJniConfiguration: ConfigurableFileCollection

  @get:OutputDirectory abstract val baseOutputDir: DirectoryProperty

  @TaskAction
  fun taskAction() {
    extractJniConfiguration.files.forEach {
      val file = it.absoluteFile
      val packageName = file.name.split("-", ".").first()
      project.copy { copySpec ->
        copySpec.from(project.zipTree(file))
        copySpec.into(baseOutputDir.dir(packageName))
        copySpec.include("jni/**/*")
      }
    }
    extractHeadersConfiguration.files.forEach {
      val file = it.absoluteFile
      val packageName = file.name.split("-", ".").first()
      project.copy { copySpec ->
        copySpec.from(project.zipTree(file))
        copySpec.into(baseOutputDir.get().dir("$packageName/headers"))
        copySpec.include("**/*.h")
      }
    }
  }
}
