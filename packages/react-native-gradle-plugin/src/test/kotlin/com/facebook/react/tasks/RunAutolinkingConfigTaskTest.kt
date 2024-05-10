/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.tests.createProject
import com.facebook.react.tests.createTestTask
import java.io.File
import java.io.FileOutputStream
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class RunAutolinkingConfigTaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun runAutolinkingConfigTask_groupIsSetCorrectly() {
    val task = createTestTask<RunAutolinkingConfigTask> {}
    assertEquals("react", task.group)
  }

  @Test
  fun runAutolinkingConfigTask_staticInputs_areSetCorrectly() {
    val project = createProject()

    val task =
        createTestTask<RunAutolinkingConfigTask> {
          it.autolinkConfigCommand.set(listOf("rm", "-rf", "/"))
          it.autolinkLockFiles.set(project.files("packager.lock", "another-packager.lock"))
          it.autolinkConfigFile.set(tempFolder.newFile("dependencies.json"))
          it.autolinkOutputFile.set(tempFolder.newFile("output.json"))
        }

    assertEquals(3, task.inputs.files.files.size)
    task.autolinkLockFiles.get().files.forEach {
      assertTrue(
          it.name == "depedencies.json" ||
              it.name == "packager.lock" ||
              it.name == "another-packager.lock")
    }

    assertTrue(task.inputs.properties.containsKey("autolinkConfigCommand"))
    assertEquals(1, task.outputs.files.files.size)
    assertEquals(File(tempFolder.root, "output.json"), task.outputs.files.singleFile)
    assertEquals(listOf("rm", "-rf", "/"), task.autolinkConfigCommand.get())

    assertEquals(2, task.autolinkLockFiles.get().files.size)
    task.autolinkLockFiles.get().files.forEach {
      assertTrue(it.name == "packager.lock" || it.name == "another-packager.lock")
    }

    assertEquals(File(tempFolder.root, "dependencies.json"), task.autolinkConfigFile.get().asFile)
    assertEquals(File(tempFolder.root, "output.json"), task.autolinkOutputFile.get().asFile)
  }

  @Test
  fun wipeOutputDir_worksCorrectly() {
    val outputDir =
        tempFolder.newFolder("output").apply {
          File(this, "output.json").createNewFile()
          File(this, "NothingToSeeHere.java").createNewFile()
        }

    val task = createTestTask<RunAutolinkingConfigTask> { it.autolinkOutputFile.set(outputDir) }
    task.wipeOutputDir()

    assertFalse(outputDir.exists())
  }

  @Test
  fun setupConfigCommandLine_worksCorrectly() {
    val project = createProject()

    val task =
        createTestTask<RunAutolinkingConfigTask>(project) {
          it.autolinkConfigCommand.set(listOf("rm", "-rf", "/"))
          it.autolinkOutputFile.set(tempFolder.newFile("output.json"))
        }
    task.setupConfigCommandLine()

    assertEquals(project.projectDir, task.workingDir)
    assertTrue(task.standardOutput is FileOutputStream)
    assertEquals(listOf("rm", "-rf", "/"), task.commandLine)
  }

  @Test
  fun setupConfigCopyCommandLine_worksCorrectly() {
    val project = createProject()

    val task =
        createTestTask<RunAutolinkingConfigTask>(project) {
          it.autolinkConfigFile.set(tempFolder.newFile("dependencies.json"))
          it.autolinkOutputFile.set(tempFolder.newFile("output.json"))
        }
    task.setupConfigCopyCommandLine()

    assertEquals(project.projectDir, task.workingDir)
    assertTrue(task.standardOutput !is FileOutputStream)
    assertEquals("cp", task.commandLine[0])
    assertEquals(File(tempFolder.root, "dependencies.json").absolutePath, task.commandLine[1])
    assertEquals(File(tempFolder.root, "output.json").absolutePath, task.commandLine[2])
  }

  @Test
  fun setupCommandLine_withoutAutolinkConfigFileConfigured_invokesCommand() {
    val project = createProject()

    val task =
        createTestTask<RunAutolinkingConfigTask>(project) {
          it.autolinkConfigCommand.set(listOf("rm", "-rf", "/"))
          it.autolinkOutputFile.set(tempFolder.newFile("output.json"))
        }
    task.setupCommandLine()

    assertEquals(listOf("rm", "-rf", "/"), task.commandLine)
  }

  @Test
  fun setupCommandLine_withoutMissingConfigFile_invokesCommand() {
    val project = createProject()

    val task =
        createTestTask<RunAutolinkingConfigTask>(project) {
          it.autolinkConfigCommand.set(listOf("rm", "-rf", "/"))
          it.autolinkConfigFile.set(File(tempFolder.root, "dependencies.json"))
          it.autolinkOutputFile.set(tempFolder.newFile("output.json"))
        }
    task.setupCommandLine()

    assertEquals(listOf("rm", "-rf", "/"), task.commandLine)
  }

  @Test
  fun setupCommandLine_withoutExistingConfigFile_invokesCp() {
    val project = createProject()
    val configFile = tempFolder.newFile("dependencies.json").apply { writeText("¯\\_(ツ)_/¯") }

    val task =
        createTestTask<RunAutolinkingConfigTask>(project) {
          it.autolinkConfigCommand.set(listOf("rm", "-rf", "/"))
          it.autolinkConfigFile.set(configFile)
          it.autolinkOutputFile.set(tempFolder.newFile("output.json"))
        }
    task.setupCommandLine()

    assertEquals(
        listOf("cp", configFile.absolutePath, File(tempFolder.root, "output.json").absolutePath),
        task.commandLine)
  }
}
