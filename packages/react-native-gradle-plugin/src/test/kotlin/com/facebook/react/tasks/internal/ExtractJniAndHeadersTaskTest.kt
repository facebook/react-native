/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks.internal

import com.facebook.react.tests.createProject
import com.facebook.react.tests.createTestTask
import com.facebook.react.tests.zipFiles
import java.io.*
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class ExtractJniAndHeadersTaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun extractJniAndHeadersTask_extractsHeadersCorrectly() {
    val project = createProject()
    val aarFile = File(project.projectDir, "libheader.aar")
    val headerFile = tempFolder.newFile("justaheader.h")
    val output = tempFolder.newFolder("output")
    zipFiles(aarFile, listOf(headerFile))

    val task =
        createTestTask<ExtractJniAndHeadersTask>(project = project) {
          it.extractHeadersConfiguration.setFrom(aarFile)
          it.baseOutputDir.set(output)
        }

    task.taskAction()

    assertTrue(File(output, "libheader/headers/justaheader.h").exists())
  }

  @Test
  fun extractJniAndHeadersTask_extractsJniCorrectly() {
    val project = createProject()
    val aarFile = File(project.projectDir, "something.aar")
    File(tempFolder.root, "jni/libsomething.so").apply {
      parentFile.mkdirs()
      createNewFile()
    }
    val output = tempFolder.newFolder("output")
    ZipOutputStream(BufferedOutputStream(FileOutputStream(aarFile.absolutePath))).use { out ->
      FileInputStream(aarFile).use { fi ->
        BufferedInputStream(fi).use { origin ->
          out.putNextEntry(ZipEntry("jni/"))
          out.putNextEntry(ZipEntry("jni/libsomething.so"))
          origin.copyTo(out, 1024)
        }
      }
    }
    val task =
        createTestTask<ExtractJniAndHeadersTask>(project = project) {
          it.extractJniConfiguration.setFrom(aarFile)
          it.baseOutputDir.set(output)
        }

    task.taskAction()

    assertTrue(File(output, "something/jni/libsomething.so").exists())
  }
}
