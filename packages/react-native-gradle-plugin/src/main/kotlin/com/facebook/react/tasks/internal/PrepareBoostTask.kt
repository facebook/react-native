/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks.internal

import java.io.File
import org.gradle.api.DefaultTask
import org.gradle.api.file.ConfigurableFileCollection
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.provider.Property
import org.gradle.api.tasks.*

/**
 * A task that takes care of extracting Boost from a source folder/zip and preparing it to be
 * consumed by the NDK
 */
abstract class PrepareBoostTask : DefaultTask() {

  @get:InputFiles abstract val boostPath: ConfigurableFileCollection

  @get:Input abstract val boostVersion: Property<String>

  @get:OutputDirectory abstract val outputDir: DirectoryProperty

  @TaskAction
  fun taskAction() {
    project.copy { it ->
      it.from(boostPath)
      it.from(project.file("src/main/jni/third-party/boost"))
      it.include(
          "CMakeLists.txt",
          "boost_${boostVersion.get()}/boost/**/*.hpp",
          "boost/boost/**/*.hpp",
          "asm/**/*.S")
      it.includeEmptyDirs = false
      it.into(outputDir)
    }
    File(outputDir.asFile.get(), "boost").apply {
      renameTo(File(this.parentFile, "boost_${boostVersion.get()}"))
    }
  }
}
