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
import org.gradle.api.tasks.*
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.net.URI
import java.nio.file.FileSystems
import java.nio.file.Files
import java.nio.file.Files.exists

class NativeLibraryAabCleanupTaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun nativeLibraryAabCleanupTask_runWithAppAab() {
    val inputAab = File(tempFolder.root, "input.aab")
    val outputAab = File(tempFolder.root, "output.aab")
    createZip(
      inputAab,
      listOf(
        "base/lib/x86/libhermes.so",
        "base/lib/x86/libhermes-executor-debug.so",
        "base/lib/x86/libhermes-executor-release.so",
        "base/lib/x86/libjsc.so",
        "base/lib/x86/libjscexecutor.so",
      )
    )
    val task = createTestTask<NativeLibraryAabCleanupTask> {
      it.inputBundle.set(inputAab)
      it.outputBundle.set(outputAab)
      it.enableHermes.set(true)
      it.debuggableVariant.set(true)
    }

    task.run()

    val fs = FileSystems.newFileSystem(
      URI.create("jar:file:${inputAab.absoluteFile}"),
      mapOf("create" to "false")
    )
    fs.use {
      assertTrue(exists(it.getPath("base/lib/x86/libhermes.so")))
      assertTrue(exists(it.getPath("base/lib/x86/libhermes-executor-debug.so")))
      assertFalse(exists(it.getPath("base/lib/x86/libhermes-executor-release.so")))
      assertFalse(exists(it.getPath("base/lib/x86/libjsc.so")))
      assertFalse(exists(it.getPath("base/lib/x86/libjscexecutor.so")))
    }
  }

}
