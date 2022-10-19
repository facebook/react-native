/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import java.io.File
import java.net.URI
import java.nio.file.FileSystem
import java.nio.file.FileSystems
import java.nio.file.Files

internal object SoCleanerUtils {

  private val zipProperties = mapOf("create" to "false")

  private val archs = listOf("x86", "x86_64", "armeabi-v7a", "arm64-v8a")

  fun clean(input: File, prefix: String, enableHermes: Boolean, debuggableVariant: Boolean) {
    val zipDisk: URI = URI.create("jar:file:${input.absolutePath}")
    FileSystems.newFileSystem(zipDisk, zipProperties).use { zipfs ->
      if (enableHermes) {
        removeSoFiles(zipfs, prefix, archs, "libjsc.so")
        removeSoFiles(zipfs, prefix, archs, "libjscexecutor.so")
        if (debuggableVariant) {
          removeSoFiles(zipfs, prefix, archs, "libhermes-executor-release.so")
        } else {
          removeSoFiles(zipfs, prefix, archs, "libhermes-executor-debug.so")
        }
      } else {
        removeSoFiles(zipfs, prefix, archs, "libhermes.so")
        removeSoFiles(zipfs, prefix, archs, "libhermes-executor-debug.so")
        removeSoFiles(zipfs, prefix, archs, "libhermes-executor-release.so")
      }
    }
  }

  fun removeSoFiles(
      zipfs: FileSystem,
      prefix: String,
      archs: List<String>,
      libraryToRemove: String
  ) {
    archs.forEach { arch ->
      try {
        Files.delete(zipfs.getPath("$prefix/$arch/$libraryToRemove"))
      } catch (e: Exception) {
        // File was already missing due to ABI split, nothing to do here.
      }
    }
  }
}
