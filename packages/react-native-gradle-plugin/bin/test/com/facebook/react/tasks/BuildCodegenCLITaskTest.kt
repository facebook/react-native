/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.tests.createTestTask
import java.io.File
import org.gradle.api.tasks.*
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class BuildCodegenCLITaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun buildCodegenCli_input_isSetCorrectly() {
    val task = createTestTask<BuildCodegenCLITask> { it.codegenDir.set(tempFolder.root) }

    assertTrue(task.input.contains(File(tempFolder.root, "scripts")))
    assertTrue(task.input.contains(File(tempFolder.root, "src")))
    assertTrue(task.input.contains(File(tempFolder.root, "package.json")))
    assertTrue(task.input.contains(File(tempFolder.root, ".babelrc")))
    assertTrue(task.input.contains(File(tempFolder.root, ".prettierrc")))
  }

  @Test
  fun buildCodegenCli_output_isSetCorrectly() {
    val task = createTestTask<BuildCodegenCLITask> { it.codegenDir.set(tempFolder.root) }

    assertTrue(task.output.contains(File(tempFolder.root, "lib")))
    assertTrue(task.output.contains(File(tempFolder.root, "node_modules")))
  }

  @Test
  fun buildCodegenCli_bashWindowsHome_isSetCorrectly() {
    val bashPath = tempFolder.newFile("bash").absolutePath
    val task = createTestTask<BuildCodegenCLITask> { it.bashWindowsHome.set(bashPath) }

    assertEquals(bashPath, task.bashWindowsHome.get())
  }

  @Test
  fun buildCodegenCli_onlyIf_withMissingDirectory_isSatisfied() {
    File(tempFolder.root, "lib/cli/").apply { mkdirs() }
    val task = createTestTask<BuildCodegenCLITask> { it.codegenDir.set(tempFolder.root) }

    assertTrue(task.onlyIf.isSatisfiedBy(task))
  }

  @Test
  fun buildCodegenCli_onlyIf_withEmptyDirectory_isSatisfied() {
    File(tempFolder.root, "lib/cli/").apply { mkdirs() }
    val task = createTestTask<BuildCodegenCLITask> { it.codegenDir.set(tempFolder.root) }

    assertTrue(task.onlyIf.isSatisfiedBy(task))
  }

  @Test
  fun buildCodegenCli_onlyIf_withExistingDirtyDirectory_isNotSatisfied() {
    File(tempFolder.root, "lib/cli/a-file").apply {
      parentFile.mkdirs()
      writeText("¯\\_(ツ)_/¯")
    }
    val task = createTestTask<BuildCodegenCLITask> { it.codegenDir.set(tempFolder.root) }

    assertFalse(task.onlyIf.isSatisfiedBy(task))
  }
}
