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

class PrepareGlogTaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test(expected = IllegalStateException::class)
  fun prepareGlogTask_withMissingConfiguration_fails() {
    val task = createTestTask<PrepareGlogTask>()

    task.taskAction()
  }

  @Test
  fun prepareGlogTask_copiesMakefile() {
    val glogpath = tempFolder.newFolder("glogpath")
    val output = tempFolder.newFolder("output")
    val project = createProject()
    val task =
        createTestTask<PrepareGlogTask>(project = project) {
          it.glogPath.setFrom(glogpath)
          it.glogVersion.set("1.0.0")
          it.outputDir.set(output)
        }
    File(project.projectDir, "src/main/jni/third-party/glog/Android.mk").apply {
      parentFile.mkdirs()
      createNewFile()
    }
    task.taskAction()

    assertTrue(output.listFiles()!!.any { it.name == "Android.mk" })
  }

  @Test
  fun prepareGlogTask_copiesConfigHeaderFile() {
    val glogpath = tempFolder.newFolder("glogpath")
    val output = tempFolder.newFolder("output")
    val project = createProject()
    val task =
        createTestTask<PrepareGlogTask>(project = project) {
          it.glogPath.setFrom(glogpath)
          it.glogVersion.set("1.0.0")
          it.outputDir.set(output)
        }
    File(project.projectDir, "src/main/jni/third-party/glog/config.h").apply {
      parentFile.mkdirs()
      createNewFile()
    }
    task.taskAction()

    assertTrue(output.listFiles()!!.any { it.name == "config.h" })
  }

  @Test
  fun prepareGlogTask_copiesSourceCode() {
    val glogpath = tempFolder.newFolder("glogpath")
    val output = tempFolder.newFolder("output")
    val task =
        createTestTask<PrepareGlogTask> {
          it.glogPath.setFrom(glogpath)
          it.glogVersion.set("1.0.0")
          it.outputDir.set(output)
        }
    File(glogpath, "glog-1.0.0/src/glog.cpp").apply {
      parentFile.mkdirs()
      createNewFile()
    }

    task.taskAction()

    assertTrue(File(output, "glog-1.0.0/src/glog.cpp").exists())
  }

  @Test
  fun prepareGlogTask_replacesTokenCorrectly() {
    val glogpath = tempFolder.newFolder("glogpath")
    val output = tempFolder.newFolder("output")
    val task =
        createTestTask<PrepareGlogTask> {
          it.glogPath.setFrom(glogpath)
          it.glogVersion.set("1.0.0")
          it.outputDir.set(output)
        }
    File(glogpath, "glog-1.0.0/src/glog.h.in").apply {
      parentFile.mkdirs()
      writeText("ac_google_start_namespace")
    }

    task.taskAction()

    val expectedFile = File(output, "glog.h")
    assertTrue(expectedFile.exists())
    assertEquals("ac_google_start_namespace", expectedFile.readText())
  }

  @Test
  fun prepareGlogTask_exportsHeaderCorrectly() {
    val glogpath = tempFolder.newFolder("glogpath")
    val output = tempFolder.newFolder("output")
    val task =
        createTestTask<PrepareGlogTask> {
          it.glogPath.setFrom(glogpath)
          it.glogVersion.set("1.0.0")
          it.outputDir.set(output)
        }
    File(glogpath, "glog-1.0.0/src/logging.h.in").apply {
      parentFile.mkdirs()
      writeText("ac_google_start_namespace")
    }

    task.taskAction()

    assertTrue(File(output, "exported/glog/logging.h").exists())
  }
}
