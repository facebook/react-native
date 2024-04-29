/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks.internal

import com.facebook.react.tests.createTestTask
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class BuildCodegenCLITaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun buildCodegenCli_bashWindowsHome_isSetCorrectly() {
    val bashPath = tempFolder.newFile("bash").absolutePath
    val task = createTestTask<BuildCodegenCLITask> { it.bashWindowsHome.set(bashPath) }

    assertEquals(bashPath, task.bashWindowsHome.get())
  }
}
