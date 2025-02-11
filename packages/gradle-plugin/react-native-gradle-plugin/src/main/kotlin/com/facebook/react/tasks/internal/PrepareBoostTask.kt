/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks.internal

import java.io.File
import javax.inject.Inject
import org.gradle.api.DefaultTask
import org.gradle.api.file.ConfigurableFileCollection
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.file.FileSystemOperations
import org.gradle.api.provider.Property
import org.gradle.api.tasks.*

/**
 * A task that takes care of extracting Boost from a source folder/zip and preparing it to be
 * consumed by the NDK
 */
abstract class PrepareBoostTask : DefaultTask() {

  @get:InputFiles abstract val boostPath: ConfigurableFileCollection
  @get:InputDirectory abstract val boostThirdPartyJniPath: DirectoryProperty

  @get:Input abstract val boostVersion: Property<String>

  @get:OutputDirectory abstract val outputDir: DirectoryProperty

  @get:Inject abstract val fs: FileSystemOperations

  @TaskAction
  fun taskAction() {
    fs.copy { it ->
      it.from(boostPath)
      it.from(boostThirdPartyJniPath)
      it.include(
          "CMakeLists.txt",
          "boost_${boostVersion.get()}/boost/**/*.hpp",
          "boost/boost/**/*.hpp",
          "asm/**/*.S")
      it.includeEmptyDirs = false
      it.into(outputDir)
    }
    File(outputDir.asFile.get(), "boost").apply {
      renameTo(File(parentFile, "boost_${boostVersion.get()}"))
    }
  }
}
