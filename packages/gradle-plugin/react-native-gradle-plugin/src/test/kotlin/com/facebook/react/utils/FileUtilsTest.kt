/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import java.io.File
import org.assertj.core.api.Assertions.assertThat
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class FileUtilsTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun moveTo_movesCorrectly() {
    val fileToMove = tempFolder.newFile().apply { writeText("42") }
    val destFolder = tempFolder.newFolder("destFolder")
    val destFile = File(destFolder, "destFile")

    fileToMove.moveTo(destFile)

    assertThat(destFile).hasContent("42")
    assertThat(fileToMove).doesNotExist()
  }

  @Test
  fun recreateDir_worksCorrectly() {
    val subFolder = tempFolder.newFolder()
    File(subFolder, "1").apply { writeText("1") }
    File(subFolder, "2").apply { writeText("2") }
    File(subFolder, "subDir").apply { mkdirs() }
    File(subFolder, "subDir/3").apply { writeText("3") }

    subFolder.recreateDir()

    assertThat(subFolder).exists()
    assertThat(subFolder.listFiles()).hasSize(0)
  }
}
