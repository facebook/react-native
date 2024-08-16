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
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class PrepareJSCTaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun prepareJSCTask_withMissingPackage_fails() {
    val task = createTestTask<PrepareJSCTask>()

    assertThatThrownBy { task.taskAction() }.isInstanceOf(IllegalStateException::class.java)
  }

  @Test
  fun prepareJSCTask_withNullPackage_fails() {
    val task = createTestTask<PrepareJSCTask> { it.jscPackagePath.set(null as String?) }

    assertThatThrownBy { task.taskAction() }.isInstanceOf(IllegalStateException::class.java)
  }

  @Test
  fun prepareJSCTask_withMissingDistFolder_fails() {
    val task =
        createTestTask<PrepareJSCTask> { it.jscPackagePath.set(tempFolder.root.absolutePath) }

    assertThatThrownBy { task.taskAction() }.isInstanceOf(IllegalStateException::class.java)
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

    assertThat(File(output, "just/an/empty/folders/")).doesNotExist()
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

    assertThat(output.listFiles()?.first()?.name).isEqualTo("libsomething.so")
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

    assertThat(File(output, "JavaScriptCore/justaheader.h")).exists()
  }

  @Test
  fun prepareJSCTask_copiesCMakefile() {
    val project = createProject()
    prepareInputFolder()
    File(project.projectDir, "src/main/jni/third-party/jsc/CMakeLists.txt").apply {
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

    assertThat(File(output, "CMakeLists.txt")).exists()
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
