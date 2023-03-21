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
 * A task that takes care of extracting Libevent from a source folder/zip and preparing it to be
 * consumed by the NDK.
 */
abstract class PrepareLibeventTask : DefaultTask() {

  @get:InputFiles abstract val libeventPath: ConfigurableFileCollection

  @get:Input abstract val libeventVersion: Property<String>

  @get:OutputDirectory abstract val outputDir: DirectoryProperty

  @TaskAction
  fun taskAction() {
    project.copy { it ->
      it.from(libeventPath)
      it.from(project.file("src/main/jni/third-party/libevent/"))
      it.include(
          "libevent-${libeventVersion.get()}-stable/*.c",
          "libevent-${libeventVersion.get()}-stable/*.h",
          "libevent-${libeventVersion.get()}-stable/include/**/*",
          "evconfig-private.h",
          "event-config.h",
          "CMakeLists.txt")
      it.eachFile { it.path = it.path.removePrefix("libevent-${libeventVersion.get()}-stable/") }
      it.includeEmptyDirs = false
      it.into(outputDir)
    }
    File(outputDir.asFile.get(), "event-config.h").apply {
      val destination =
          File(this.parentFile, "include/event2/event-config.h").apply { parentFile.mkdirs() }
      renameTo(destination)
    }
  }
}
