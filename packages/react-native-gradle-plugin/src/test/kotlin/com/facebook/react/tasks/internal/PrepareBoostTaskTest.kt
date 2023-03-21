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

class PrepareBoostTaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test(expected = IllegalStateException::class)
  fun prepareBoostTask_withMissingConfiguration_fails() {
    val task = createTestTask<PrepareBoostTask>()

    task.taskAction()
  }

  @Test
  fun prepareBoostTask_copiesCMakefile() {
    val boostpath = tempFolder.newFolder("boostpath")
    val output = tempFolder.newFolder("output")
    val project = createProject()
    val task =
        createTestTask<PrepareBoostTask>(project = project) {
          it.boostPath.setFrom(boostpath)
          it.boostVersion.set("1.0.0")
          it.outputDir.set(output)
        }
    File(project.projectDir, "src/main/jni/third-party/boost/CMakeLists.txt").apply {
      parentFile.mkdirs()
      createNewFile()
    }
    task.taskAction()

    assertTrue(output.listFiles()!!.any { it.name == "CMakeLists.txt" })
  }

  @Test
  fun prepareBoostTask_copiesAsmFiles() {
    val boostpath = tempFolder.newFolder("boostpath")
    val output = tempFolder.newFolder("output")
    val task =
        createTestTask<PrepareBoostTask>() {
          it.boostPath.setFrom(boostpath)
          it.boostVersion.set("1.0.0")
          it.outputDir.set(output)
        }
    File(boostpath, "asm/asm.S").apply {
      parentFile.mkdirs()
      createNewFile()
    }
    task.taskAction()

    assertTrue(File(output, "asm/asm.S").exists())
  }

  @Test
  fun prepareBoostTask_copiesBoostSourceFiles() {
    val boostpath = tempFolder.newFolder("boostpath")
    val output = tempFolder.newFolder("output")
    val task =
        createTestTask<PrepareBoostTask> {
          it.boostPath.setFrom(boostpath)
          it.boostVersion.set("1.0.0")
          it.outputDir.set(output)
        }
    File(boostpath, "boost_1.0.0/boost/config.hpp").apply {
      parentFile.mkdirs()
      createNewFile()
    }
    task.taskAction()

    assertTrue(File(output, "boost_1.0.0/boost/config.hpp").exists())
  }

  @Test
  fun prepareBoostTask_copiesVersionlessBoostSourceFiles() {
    val boostpath = tempFolder.newFolder("boostpath")
    val output = tempFolder.newFolder("output")
    val task =
        createTestTask<PrepareBoostTask> {
          it.boostPath.setFrom(boostpath)
          it.boostVersion.set("1.0.0")
          it.outputDir.set(output)
        }
    File(boostpath, "boost/boost/config.hpp").apply {
      parentFile.mkdirs()
      createNewFile()
    }
    task.taskAction()

    assertTrue(File(output, "boost_1.0.0/boost/config.hpp").exists())
  }
}
