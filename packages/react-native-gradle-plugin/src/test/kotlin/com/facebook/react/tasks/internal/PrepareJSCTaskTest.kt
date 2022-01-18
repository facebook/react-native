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
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class PrepareJSCTaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test(expected = IllegalStateException::class)
  fun prepareJSCTask_withMissingPackage_fails() {
    val task = createTestTask<PrepareJSCTask>()

    task.taskAction()
  }

  @Test(expected = IllegalStateException::class)
  fun prepareJSCTask_withNullPackage_fails() {
    val task = createTestTask<PrepareJSCTask> { it.jscPackagePath.set(null as String?) }

    task.taskAction()
  }

  @Test(expected = IllegalStateException::class)
  fun prepareJSCTask_withMissingDistFolder_fails() {
    val task =
        createTestTask<PrepareJSCTask> { it.jscPackagePath.set(tempFolder.root.absolutePath) }

    task.taskAction()
  }

  @Test
  fun prepareJSCTask_ignoresEmptyDirs() {
    prepareInputFolder()
    val output = tempFolder.newFolder("output")
    File(tempFolder.root, "dist/just/an/empty/folders/").apply { mkdirs() }

    val task =
        createTestTask<PrepareJSCTask> {
          it.jscPackagePath.set(tempFolder.root.absolutePath)
          it.outputDir.set(output)
        }

    task.taskAction()

    assertFalse(File(output, "just/an/empty/folders/").exists())
  }

  @Test
  fun prepareJSCTask_copiesSoFiles() {
    val soFile = tempFolder.newFile("libsomething.so")
    prepareInputFolder(aarContent = listOf(soFile))
    val output = tempFolder.newFolder("output")

    val task =
        createTestTask<PrepareJSCTask> {
          it.jscPackagePath.set(tempFolder.root.absolutePath)
          it.outputDir.set(output)
        }

    task.taskAction()

    assertEquals("libsomething.so", output.listFiles()?.first()?.name)
  }

  @Test
  fun prepareJSCTask_copiesHeaderFilesToCorrectFolder() {
    prepareInputFolder()
    File(tempFolder.root, "dist/include/justaheader.h").apply {
      parentFile.mkdirs()
      createNewFile()
    }
    val output = tempFolder.newFolder("output")

    val task =
        createTestTask<PrepareJSCTask> {
          it.jscPackagePath.set(tempFolder.root.absolutePath)
          it.outputDir.set(output)
        }

    task.taskAction()

    assertTrue(File(output, "JavaScriptCore/justaheader.h").exists())
  }

  @Test
  fun prepareJSCTask_copiesMakefile() {
    val project = createProject()
    prepareInputFolder()
    File(project.projectDir, "src/main/jni/third-party/jsc/Android.mk").apply {
      parentFile.mkdirs()
      createNewFile()
    }
    val output = tempFolder.newFolder("output")

    val task =
        createTestTask<PrepareJSCTask>(project = project) {
          it.jscPackagePath.set(tempFolder.root.absolutePath)
          it.outputDir.set(output)
        }

    task.taskAction()

    assertTrue(File(output, "Android.mk").exists())
  }

  private fun prepareInputFolder(aarContent: List<File> = listOf(tempFolder.newFile())) {
    val dist = tempFolder.newFolder("dist")
    File(dist, "android-jsc/android-library.aar").apply {
      parentFile.mkdirs()
      createNewFile()
    }
    zipFiles(File(dist, "android-jsc/android-library.aar"), aarContent)
  }
}
