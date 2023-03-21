/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks.internal

import com.facebook.react.tests.createProject
import com.facebook.react.tests.createTestTask
import java.io.*
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class PrepareLibeventTaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test(expected = IllegalStateException::class)
  fun prepareBoostTask_withMissingConfiguration_fails() {
    val task = createTestTask<PrepareLibeventTask>()

    task.taskAction()
  }

  @Test
  fun prepareBoostTask_copiesCMakefile() {
    val libeventPath = tempFolder.newFolder("libeventPath")
    val output = tempFolder.newFolder("output")
    val project = createProject()
    val task =
        createTestTask<PrepareLibeventTask>(project = project) {
          it.libeventPath.setFrom(libeventPath)
          it.libeventVersion.set("1.0.0")
          it.outputDir.set(output)
        }
    File(project.projectDir, "src/main/jni/third-party/libevent/CMakeLists.txt").apply {
      parentFile.mkdirs()
      createNewFile()
    }
    task.taskAction()

    assertTrue(File(output, "CMakeLists.txt").exists())
  }

  @Test
  fun prepareBoostTask_copiesConfigFiles() {
    val libeventPath = tempFolder.newFolder("libeventPath")
    val output = tempFolder.newFolder("output")
    val project = createProject()
    val task =
        createTestTask<PrepareLibeventTask>(project = project) {
          it.libeventPath.setFrom(libeventPath)
          it.libeventVersion.set("1.0.0")
          it.outputDir.set(output)
        }
    File(project.projectDir, "src/main/jni/third-party/libevent/event-config.h").apply {
      parentFile.mkdirs()
      createNewFile()
    }
    File(project.projectDir, "src/main/jni/third-party/libevent/evconfig-private.h").createNewFile()

    task.taskAction()

    assertTrue(File(output, "evconfig-private.h").exists())
    assertTrue(File(output, "include/event2/event-config.h").exists())
  }

  @Test
  fun prepareBoostTask_copiesSourceFiles() {
    val libeventPath = tempFolder.newFolder("libeventPath")
    val output = tempFolder.newFolder("output")
    val task =
        createTestTask<PrepareLibeventTask> {
          it.libeventPath.setFrom(libeventPath)
          it.libeventVersion.set("1.0.0")
          it.outputDir.set(output)
        }
    File(libeventPath, "libevent-1.0.0-stable/sample.c").apply {
      parentFile.mkdirs()
      createNewFile()
    }
    File(libeventPath, "libevent-1.0.0-stable/sample.h").apply {
      parentFile.mkdirs()
      createNewFile()
    }
    File(libeventPath, "libevent-1.0.0-stable/include/sample.h").apply {
      parentFile.mkdirs()
      createNewFile()
    }

    task.taskAction()

    assertTrue(File(output, "sample.c").exists())
    assertTrue(File(output, "sample.h").exists())
    assertTrue(File(output, "include/sample.h").exists())
  }
}
