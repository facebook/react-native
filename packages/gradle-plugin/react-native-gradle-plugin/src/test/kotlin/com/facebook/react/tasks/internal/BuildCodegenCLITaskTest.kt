/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks.internal

import com.facebook.react.tests.createProject
import com.facebook.react.tests.createTestTask
import org.assertj.core.api.Assertions.assertThat
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class BuildCodegenCLITaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun buildCodegenCli_inputProperties_areSetCorrectly() {
    val project = createProject(tempFolder.root)
    val bashPath = tempFolder.newFile("bash").absolutePath
    val logFile = tempFolder.newFile("logfile.out")
    val fileTree = project.fileTree(".")
    val task =
        createTestTask<BuildCodegenCLITask> { task ->
          task.bashWindowsHome.set(bashPath)
          task.logFile.set(logFile)
          task.inputFiles.set(fileTree)
          task.outputFiles.set(fileTree)
        }

    assertThat(task.bashWindowsHome.get()).isEqualTo(bashPath)
    assertThat(task.logFile.get().asFile).isEqualTo(logFile)
    assertThat(task.inputFiles.get()).isEqualTo(fileTree)
    assertThat(task.outputFiles.get()).isEqualTo(fileTree)
  }
}
