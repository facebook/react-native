/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.tests.createTestTask
import com.facebook.react.tests.createZip
import java.io.File
import java.net.URI
import java.nio.file.FileSystems
import java.nio.file.Files.exists
import org.gradle.api.tasks.*
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class NativeLibraryApkCleanupTaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun nativeLibraryApkCleanupTask_runWithAppApk() {
    val tempApk = File(tempFolder.root, "app.apk")
    createZip(
        tempApk,
        listOf(
            "lib/x86/libhermes.so",
            "lib/x86/libhermes-executor-debug.so",
            "lib/x86/libhermes-executor-release.so",
            "lib/x86/libjsc.so",
            "lib/x86/libjscexecutor.so",
        ))
    val task =
        createTestTask<NativeLibraryApkCleanupTask> {
          it.inputApkDirectory.set(tempFolder.root)
          it.outputApkDirectory.set(tempFolder.root)
          it.enableHermes.set(true)
          it.debuggableVariant.set(true)
        }

    task.run()

    val fs =
        FileSystems.newFileSystem(
            URI.create("jar:file:${tempApk.absoluteFile}"), mapOf("create" to "false"))
    fs.use {
      assertTrue(exists(it.getPath("lib/x86/libhermes.so")))
      assertTrue(exists(it.getPath("lib/x86/libhermes-executor-debug.so")))
      assertFalse(exists(it.getPath("lib/x86/libhermes-executor-release.so")))
      assertFalse(exists(it.getPath("lib/x86/libjsc.so")))
      assertFalse(exists(it.getPath("lib/x86/libjscexecutor.so")))
    }
  }
}
