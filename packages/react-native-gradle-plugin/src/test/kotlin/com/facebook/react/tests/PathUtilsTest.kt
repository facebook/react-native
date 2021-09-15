/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tests

import com.facebook.react.TestReactAppExtension
import com.facebook.react.utils.detectedCliPath
import com.facebook.react.utils.detectedEntryFile
import com.facebook.react.utils.detectedHermesCommand
import java.io.File
import org.gradle.testfixtures.ProjectBuilder
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class PathUtilsTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun detectedEntryFile_withProvidedVariable() {
    val extension = TestReactAppExtension(ProjectBuilder.builder().build())
    val expected = tempFolder.newFile("fake.index.js")
    extension.entryFile.set(expected)

    val actual = detectedEntryFile(extension)

    assertEquals(expected, actual)
  }

  @Test
  fun detectedEntryFile_withAndroidEntryPoint() {
    val extension = TestReactAppExtension(ProjectBuilder.builder().build())
    extension.reactRoot.set(tempFolder.root)
    tempFolder.newFile("index.android.js")

    val actual = detectedEntryFile(extension)

    assertEquals(File(tempFolder.root, "index.android.js"), actual)
  }

  @Test
  fun detectedEntryFile_withDefaultEntryPoint() {
    val extension = TestReactAppExtension(ProjectBuilder.builder().build())
    extension.reactRoot.set(tempFolder.root)

    val actual = detectedEntryFile(extension)

    assertEquals(File(tempFolder.root, "index.js"), actual)
  }

  @Test
  fun detectedCliPath_withCliPathFromExtension() {
    val project = ProjectBuilder.builder().build()
    val extension = TestReactAppExtension(project)
    val expected = File(project.projectDir, "fake-cli.sh")
    extension.cliPath.set("fake-cli.sh")

    val actual = detectedCliPath(project.projectDir, extension)

    assertEquals(expected.toString(), actual)
  }

  @Test
  fun detectedCliPath_withCliPathFromExtensionInParentFolder() {
    val rootProject = ProjectBuilder.builder().build()
    val project = ProjectBuilder.builder().withParent(rootProject).build()
    val extension = TestReactAppExtension(project)
    val expected = File(rootProject.projectDir, "cli-in-root.sh").apply { writeText("#!/bin/bash") }
    extension.cliPath.set("../cli-in-root.sh")

    val actual = detectedCliPath(project.projectDir, extension)

    assertEquals(expected.canonicalPath, File(actual).canonicalPath)
  }

  @Test
  fun detectedCliPath_withCliFromNodeModules() {
    val project = ProjectBuilder.builder().build()
    val extension = TestReactAppExtension(project)
    extension.reactRoot.set(tempFolder.root)
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
    val extension = TestReactAppExtension(project)

    detectedCliPath(project.projectDir, extension)
  }

  @Test
  fun detectedHermesCommand_withPathFromExtension() {
    val extension = TestReactAppExtension(ProjectBuilder.builder().build())
    val expected = tempFolder.newFile("hermesc")
    extension.hermesCommand.set(expected.toString())

    val actual = detectedHermesCommand(extension)

    assertEquals(expected.toString(), actual)
  }

  @Test
  fun detectedHermesCommand_withOSSpecificBin() {
    val extension = TestReactAppExtension(ProjectBuilder.builder().build())

    val actual = detectedHermesCommand(extension)

    assertTrue(actual.startsWith("node_modules/hermes-engine/"))
    assertTrue(actual.endsWith("hermesc"))
    assertFalse(actual.contains("%OS-BIN%"))
  }
}
