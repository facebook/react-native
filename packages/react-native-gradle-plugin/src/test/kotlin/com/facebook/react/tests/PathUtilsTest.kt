/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tests

import com.facebook.react.ReactAppExtension
import com.facebook.react.utils.detectedCliPath
import com.facebook.react.utils.detectedEntryFile
import java.io.File
import org.gradle.testfixtures.ProjectBuilder
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class PathUtilsTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun detectedEntryFile_withProvidedVariable() {
    val extension = ReactAppExtension(ProjectBuilder.builder().build())
    val expected = tempFolder.newFile("fake.index.js")
    extension.entryFile = expected

    val actual = detectedEntryFile(extension)

    assertEquals(expected, actual)
  }

  @Test
  fun detectedEntryFile_withAndroidEntryPoint() {
    val extension = ReactAppExtension(ProjectBuilder.builder().build())
    extension.reactRoot = tempFolder.root
    tempFolder.newFile("index.android.js")

    val actual = detectedEntryFile(extension)

    assertEquals(File(tempFolder.root, "index.android.js"), actual)
  }

  @Test
  fun detectedEntryFile_withDefaultEntryPoint() {
    val extension = ReactAppExtension(ProjectBuilder.builder().build())
    extension.reactRoot = tempFolder.root

    val actual = detectedEntryFile(extension)

    assertEquals(File(tempFolder.root, "index.js"), actual)
  }

  @Test
  fun detectedCliPath_withCliPathFromExtension() {
    val project = ProjectBuilder.builder().build()
    val extension = ReactAppExtension(project)
    val expected = tempFolder.newFile("fake-cli.sh")
    extension.cliPath = expected.toString()

    val actual = detectedCliPath(project.projectDir, extension)

    assertEquals(expected.toString(), actual)
  }

  @Test
  fun detectedCliPath_withCliFromNodeModules() {
    val project = ProjectBuilder.builder().build()
    val extension = ReactAppExtension(project)
    extension.reactRoot = tempFolder.root
    val expected =
        File(tempFolder.root, "node_modules/react-native/cli.js").apply {
          parentFile.mkdirs()
          writeText("<!-- nothing to see here -->")
        }

    val actual = detectedCliPath(project.projectDir, extension)

    assertEquals(expected.toString(), actual)
  }

  @Test(expected = IllegalStateException::class)
  fun detectedCliPath_failsIfNotFound() {
    val project = ProjectBuilder.builder().build()
    val extension = ReactAppExtension(project)

    detectedCliPath(project.projectDir, extension)
  }
}
