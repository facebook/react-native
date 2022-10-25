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
      buildList {
            if (enableHermes) {
              add("libjsc.so")
              add("libjscexecutor.so")
              if (debuggableVariant) {
                add("libhermes-executor-release.so")
              } else {
                add("libhermes-executor-debug.so")
              }
            } else {
              add("libhermes.so")
              add("libhermes-executor-debug.so")
              add("libhermes-executor-release.so")
            }
          }
          .forEach { removeSoFiles(zipfs, prefix, archs, it) }
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
