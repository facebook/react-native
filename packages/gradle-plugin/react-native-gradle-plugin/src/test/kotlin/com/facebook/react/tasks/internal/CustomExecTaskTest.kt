/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks.internal

import com.facebook.react.tests.createTestTask
import org.assertj.core.api.Assertions.assertThat
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class CustomExecTaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun customExec_inputProperties_areSetCorrectly() {
    val outFile = tempFolder.newFile("stdout")
    val errFile = tempFolder.newFile("stderr")
    val task =
        createTestTask<CustomExecTask> { task ->
          task.errorOutputFile.set(errFile)
          task.standardOutputFile.set(outFile)
        }

    assertThat(task.errorOutputFile.get().asFile).isEqualTo(errFile)
    assertThat(task.standardOutputFile.get().asFile).isEqualTo(outFile)
  }
}
