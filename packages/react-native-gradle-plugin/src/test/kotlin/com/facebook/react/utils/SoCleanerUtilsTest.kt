/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.facebook.react.tests.createZip
import com.facebook.react.utils.SoCleanerUtils.clean
import com.facebook.react.utils.SoCleanerUtils.removeSoFiles
import java.io.File
import java.net.URI
import java.nio.file.FileSystems
import java.nio.file.Files.*
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.Test.None
import org.junit.rules.TemporaryFolder

class SoCleanerUtilsTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun clean_withEnableHermesAndDebuggableVariant_removesCorrectly() {
    val tempZip =
        File(tempFolder.root, "app.apk").apply {
          createZip(
              this,
              listOf(
                  "lib/x86/libhermes.so",
                  "lib/x86/libhermes-executor-debug.so",
                  "lib/x86/libhermes-executor-release.so",
                  "lib/x86/libjsc.so",
                  "lib/x86/libjscexecutor.so",
              ))
        }

    clean(tempZip, "lib", enableHermes = true, debuggableVariant = true)

    val fs =
        FileSystems.newFileSystem(
            URI.create("jar:file:${tempZip.absoluteFile}"), mapOf("create" to "false"))
    fs.use {
      assertTrue(exists(it.getPath("lib/x86/libhermes.so")))
      assertTrue(exists(it.getPath("lib/x86/libhermes-executor-debug.so")))
      assertFalse(exists(it.getPath("lib/x86/libhermes-executor-release.so")))
      assertFalse(exists(it.getPath("lib/x86/libjsc.so")))
      assertFalse(exists(it.getPath("lib/x86/libjscexecutor.so")))
    }
  }

  @Test
  fun clean_withEnableHermesAndNonDebuggableVariant_removesCorrectly() {
    val tempZip =
        File(tempFolder.root, "app.apk").apply {
          createZip(
              this,
              listOf(
                  "lib/x86/libhermes.so",
                  "lib/x86/libhermes-executor-debug.so",
                  "lib/x86/libhermes-executor-release.so",
                  "lib/x86/libjsc.so",
                  "lib/x86/libjscexecutor.so",
              ))
        }

    clean(tempZip, "lib", enableHermes = true, debuggableVariant = false)

    val fs =
        FileSystems.newFileSystem(
            URI.create("jar:file:${tempZip.absoluteFile}"), mapOf("create" to "false"))
    fs.use {
      assertTrue(exists(it.getPath("lib/x86/libhermes.so")))
      assertFalse(exists(it.getPath("lib/x86/libhermes-executor-debug.so")))
      assertTrue(exists(it.getPath("lib/x86/libhermes-executor-release.so")))
      assertFalse(exists(it.getPath("lib/x86/libjsc.so")))
      assertFalse(exists(it.getPath("lib/x86/libjscexecutor.so")))
    }
  }

  @Test
  fun clean_withJscAndDebuggableVariant_removesCorrectly() {
    val tempZip =
        File(tempFolder.root, "app.apk").apply {
          createZip(
              this,
              listOf(
                  "lib/x86/libhermes.so",
                  "lib/x86/libhermes-executor-debug.so",
                  "lib/x86/libhermes-executor-release.so",
                  "lib/x86/libjsc.so",
                  "lib/x86/libjscexecutor.so",
              ))
        }

    clean(tempZip, "lib", enableHermes = false, debuggableVariant = true)

    val fs =
        FileSystems.newFileSystem(
            URI.create("jar:file:${tempZip.absoluteFile}"), mapOf("create" to "false"))
    fs.use {
      assertFalse(exists(it.getPath("lib/x86/libhermes.so")))
      assertFalse(exists(it.getPath("lib/x86/libhermes-executor-debug.so")))
      assertFalse(exists(it.getPath("lib/x86/libhermes-executor-release.so")))
      assertTrue(exists(it.getPath("lib/x86/libjsc.so")))
      assertTrue(exists(it.getPath("lib/x86/libjscexecutor.so")))
    }
  }

  @Test
  fun clean_withJscAndNonDebuggableVariant_removesCorrectly() {
    val tempZip =
        File(tempFolder.root, "app.apk").apply {
          createZip(
              this,
              listOf(
                  "lib/x86/libhermes.so",
                  "lib/x86/libhermes-executor-debug.so",
                  "lib/x86/libhermes-executor-release.so",
                  "lib/x86/libjsc.so",
                  "lib/x86/libjscexecutor.so",
              ))
        }

    clean(tempZip, "lib", enableHermes = false, debuggableVariant = false)

    val fs =
        FileSystems.newFileSystem(
            URI.create("jar:file:${tempZip.absoluteFile}"), mapOf("create" to "false"))
    fs.use {
      assertFalse(exists(it.getPath("lib/x86/libhermes.so")))
      assertFalse(exists(it.getPath("lib/x86/libhermes-executor-debug.so")))
      assertFalse(exists(it.getPath("lib/x86/libhermes-executor-release.so")))
      assertTrue(exists(it.getPath("lib/x86/libjsc.so")))
      assertTrue(exists(it.getPath("lib/x86/libjscexecutor.so")))
    }
  }

  @Test(expected = None::class)
  fun removeSoFiles_withEmptyZip_doesNothing() {
    val tempZip = File(tempFolder.root, "app.apk")
    createZip(tempZip, emptyList())

    val fs =
        FileSystems.newFileSystem(
            URI.create("jar:file:${tempZip.absoluteFile}"), mapOf("create" to "false"))
    val archs = listOf("x86")
    val libraryToRemove = "libhello.so"

    removeSoFiles(fs, "lib", archs, libraryToRemove)
  }

  @Test
  fun removeSoFiles_withValidFiles_filtersThemCorrectly() {
    val tempZip = File(tempFolder.root, "app.apk")
    createZip(
        tempZip,
        listOf(
            "base/lib/x86_64/libhermes.so",
            "base/lib/x86/libhermes.so",
            "lib/arm64-v8a/libhermes.so",
            "lib/armeabi-v7a/libhermes.so",
            "lib/x86/libhermes.so",
            "lib/x86_64/libhermes.so",
        ))

    val fs =
        FileSystems.newFileSystem(
            URI.create("jar:file:${tempZip.absoluteFile}"), mapOf("create" to "false"))
    val archs = listOf("x86", "x86_64")
    val libraryToRemove = "libhermes.so"

    removeSoFiles(fs, "lib", archs, libraryToRemove)

    fs.use {
      assertTrue(exists(it.getPath("base/lib/x86/libhermes.so")))
      assertTrue(exists(it.getPath("base/lib/x86_64/libhermes.so")))
      assertTrue(exists(it.getPath("lib/arm64-v8a/libhermes.so")))
      assertTrue(exists(it.getPath("lib/armeabi-v7a/libhermes.so")))
      assertFalse(exists(it.getPath("lib/x86/libhermes.so")))
      assertFalse(exists(it.getPath("lib/x86_64/libhermes.so")))
    }
  }
}
