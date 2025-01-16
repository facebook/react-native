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
import org.assertj.core.api.Assertions.assertThat
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
  fun prepareGlogTask_copiesCMakefile() {
    val glogpath = tempFolder.newFolder("glogpath")
    val output = tempFolder.newFolder("output")
    val project = createProject()
    val glogThirdPartyJniPath = File(project.projectDir, "src/main/jni/third-party/glog/")
    val task =
        createTestTask<PrepareGlogTask>(project = project) {
          it.glogPath.setFrom(glogpath)
          it.glogThirdPartyJniPath.set(glogThirdPartyJniPath)
          it.glogVersion.set("1.0.0")
          it.outputDir.set(output)
        }
    File(glogThirdPartyJniPath, "CMakeLists.txt").apply {
      parentFile.mkdirs()
      createNewFile()
    }
    task.taskAction()

    assertThat(output.listFiles()!!.any { it.name == "CMakeLists.txt" }).isTrue()
  }

  @Test
  fun prepareGlogTask_copiesConfigHeaderFile() {
    val glogpath = tempFolder.newFolder("glogpath")
    val output = tempFolder.newFolder("output")
    val project = createProject()
    val glogThirdPartyJniPath = File(project.projectDir, "src/main/jni/third-party/glog/")
    val task =
        createTestTask<PrepareGlogTask>(project = project) {
          it.glogPath.setFrom(glogpath)
          it.glogThirdPartyJniPath.set(glogThirdPartyJniPath)
          it.glogVersion.set("1.0.0")
          it.outputDir.set(output)
        }
    File(glogThirdPartyJniPath, "config.h").apply {
      parentFile.mkdirs()
      createNewFile()
    }
    task.taskAction()

    assertThat(output.listFiles()!!.any { it.name == "config.h" }).isTrue()
  }

  @Test
  fun prepareGlogTask_copiesSourceCode() {
    val glogpath = tempFolder.newFolder("glogpath")
    val glogThirdPartyJniPath = tempFolder.newFolder("glogpath/jni")
    val output = tempFolder.newFolder("output")
    val task =
        createTestTask<PrepareGlogTask> {
          it.glogPath.setFrom(glogpath)
          it.glogThirdPartyJniPath.set(glogThirdPartyJniPath)
          it.glogVersion.set("1.0.0")
          it.outputDir.set(output)
        }
    File(glogpath, "glog-1.0.0/src/glog.cpp").apply {
      parentFile.mkdirs()
      createNewFile()
    }

    task.taskAction()

    assertThat(File(output, "glog-1.0.0/src/glog.cpp").exists()).isTrue()
  }

  @Test
  fun prepareGlogTask_replacesTokenCorrectly() {
    val glogpath = tempFolder.newFolder("glogpath")
    val glogThirdPartyJniPath = tempFolder.newFolder("glogpath/jni")
    val output = tempFolder.newFolder("output")
    val task =
        createTestTask<PrepareGlogTask> {
          it.glogPath.setFrom(glogpath)
          it.glogThirdPartyJniPath.set(glogThirdPartyJniPath)
          it.glogVersion.set("1.0.0")
          it.outputDir.set(output)
        }
    File(glogpath, "glog-1.0.0/src/glog.h.in").apply {
      parentFile.mkdirs()
      writeText("ac_google_start_namespace")
    }

    task.taskAction()

    val expectedFile = File(output, "glog.h")
    assertThat(expectedFile.exists()).isTrue()
    assertThat(expectedFile.readText()).isEqualTo("ac_google_start_namespace")
  }

  @Test
  fun prepareGlogTask_exportsHeaderCorrectly() {
    val glogpath = tempFolder.newFolder("glogpath")
    val glogThirdPartyJniPath = tempFolder.newFolder("glogpath/jni")
    val output = tempFolder.newFolder("output")
    val task =
        createTestTask<PrepareGlogTask> {
          it.glogPath.setFrom(glogpath)
          it.glogThirdPartyJniPath.set(glogThirdPartyJniPath)
          it.glogVersion.set("1.0.0")
          it.outputDir.set(output)
        }
    File(glogpath, "glog-1.0.0/src/logging.h.in").apply {
      parentFile.mkdirs()
      writeText("ac_google_start_namespace")
    }

    task.taskAction()

    assertThat(File(output, "exported/glog/logging.h").exists()).isTrue()
  }
}
