/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.facebook.react.ReactExtension
import com.facebook.react.TestReactExtension
import com.facebook.react.tests.OS
import com.facebook.react.tests.OsRule
import com.facebook.react.tests.WithOs
import java.io.File
import org.gradle.testfixtures.ProjectBuilder
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class PathUtilsTest {

  @get:Rule val tempFolder = TemporaryFolder()
  @get:Rule val osRule = OsRule()

  @Test
  fun detectedEntryFile_withProvidedVariable() {
    val extension = TestReactExtension(ProjectBuilder.builder().build())
    val expected = tempFolder.newFile("fake.index.js")
    extension.entryFile.set(expected)

    val actual = detectedEntryFile(extension)

    assertEquals(expected, actual)
  }

  @Test
  fun detectedEntryFile_withAndroidEntryPoint() {
    val extension = TestReactExtension(ProjectBuilder.builder().build())
    extension.root.set(tempFolder.root)
    tempFolder.newFile("index.android.js")

    val actual = detectedEntryFile(extension)

    assertEquals(File(tempFolder.root, "index.android.js"), actual)
  }

  @Test
  fun detectedEntryFile_withDefaultEntryPoint() {
    val extension = TestReactExtension(ProjectBuilder.builder().build())
    extension.root.set(tempFolder.root)

    val actual = detectedEntryFile(extension)

    assertEquals(File(tempFolder.root, "index.js"), actual)
  }

  @Test
  fun detectedCliPath_withCliPathFromExtensionAbsolute() {
    val project = ProjectBuilder.builder().build()
    val extension = TestReactExtension(project)
    val expected =
        File(project.projectDir, "abs/fake-cli.sh").apply {
          parentFile.mkdirs()
          writeText("<!-- nothing to see here -->")
        }
    extension.cliPath.set(project.projectDir.toString() + "/abs/fake-cli.sh")

    val actual = detectedCliPath(project.projectDir, extension)

    assertEquals(expected.toString(), actual)
  }

  @Test
  fun detectedCliPath_withCliPathFromExtensionInReactFolder() {
    val project = ProjectBuilder.builder().build()
    val extension = TestReactExtension(project)
    val expected =
        File(project.projectDir, "/react-root/fake-cli.sh").apply {
          parentFile.mkdirs()
          writeText("<!-- nothing to see here -->")
        }
    extension.cliPath.set("fake-cli.sh")
    extension.root.set(File(project.projectDir.toString(), "react-root"))

    val actual = detectedCliPath(project.projectDir, extension)

    assertEquals(expected.toString(), actual)
  }

  @Test
  fun detectedCliPath_withCliPathFromExtensionInProjectFolder() {
    val project = ProjectBuilder.builder().build()
    val extension = TestReactExtension(project)
    val expected =
        File(project.projectDir, "fake-cli.sh").apply {
          parentFile.mkdirs()
          writeText("<!-- nothing to see here -->")
        }
    extension.cliPath.set("fake-cli.sh")

    val actual = detectedCliPath(project.projectDir, extension)

    assertEquals(expected.toString(), actual)
  }

  @Test
  fun detectedCliPath_withCliPathFromExtensionInParentFolder() {
    val rootProject = ProjectBuilder.builder().build()
    val project = ProjectBuilder.builder().withParent(rootProject).build()
    project.projectDir.mkdirs()
    val extension = TestReactExtension(project)
    val expected = File(rootProject.projectDir, "cli-in-root.sh").apply { writeText("#!/bin/bash") }
    extension.cliPath.set("../cli-in-root.sh")

    val actual = detectedCliPath(project.projectDir, extension)

    assertEquals(expected.canonicalPath, File(actual).canonicalPath)
  }

  @Test
  fun detectedCliPath_withCliFromNodeModules() {
    val project = ProjectBuilder.builder().build()
    val extension = TestReactExtension(project)
    extension.root.set(tempFolder.root)
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
    val extension = TestReactExtension(project)

    detectedCliPath(project.projectDir, extension)
  }

  @Test
  fun projectPathToLibraryName_withSimplePath() {
    assertEquals("SampleSpec", projectPathToLibraryName(":sample"))
  }

  @Test
  fun projectPathToLibraryName_withComplexPath() {
    assertEquals("SampleAndroidAppSpec", projectPathToLibraryName(":sample:android:app"))
  }

  @Test
  fun projectPathToLibraryName_withKebabCase() {
    assertEquals("SampleAndroidAppSpec", projectPathToLibraryName("sample-android-app"))
  }

  @Test
  fun projectPathToLibraryName_withDotsAndUnderscores() {
    assertEquals("SampleAndroidAppSpec", projectPathToLibraryName("sample_android.app"))
  }

  @Test
  fun detectOSAwareHermesCommand_withProvidedCommand() {
    assertEquals(
        "./my-home/hermes", detectOSAwareHermesCommand(tempFolder.root, "./my-home/hermes"))
  }

  @Test
  fun detectOSAwareHermesCommand_withHermescBuiltLocally() {
    // As we can't mock env variables, we skip this test if an override of the Hermes
    // path has been provided.
    assumeTrue(System.getenv("REACT_NATIVE_OVERRIDE_HERMES_DIR") == null)

    tempFolder.newFolder("node_modules/react-native/ReactAndroid/hermes-engine/build/hermes/bin/")
    val expected =
        tempFolder.newFile(
            "node_modules/react-native/ReactAndroid/hermes-engine/build/hermes/bin/hermesc")

    assertEquals(expected.toString(), detectOSAwareHermesCommand(tempFolder.root, ""))
  }

  @Test
  @WithOs(OS.MAC)
  fun detectOSAwareHermesCommand_withBundledHermescInsideRN() {
    tempFolder.newFolder("node_modules/react-native/sdks/hermesc/osx-bin/")
    val expected = tempFolder.newFile("node_modules/react-native/sdks/hermesc/osx-bin/hermesc")

    assertEquals(expected.toString(), detectOSAwareHermesCommand(tempFolder.root, ""))
  }

  @Test(expected = IllegalStateException::class)
  @WithOs(OS.MAC)
  fun detectOSAwareHermesCommand_failsIfNotFound() {
    detectOSAwareHermesCommand(tempFolder.root, "")
  }

  @Test
  @WithOs(OS.MAC)
  fun detectOSAwareHermesCommand_withProvidedCommand_takesPrecedence() {
    tempFolder.newFolder("node_modules/react-native/sdks/hermes/build/bin/")
    tempFolder.newFile("node_modules/react-native/sdks/hermes/build/bin/hermesc")
    tempFolder.newFolder("node_modules/react-native/sdks/hermesc/osx-bin/")
    tempFolder.newFile("node_modules/react-native/sdks/hermesc/osx-bin/hermesc")

    assertEquals(
        "./my-home/hermes", detectOSAwareHermesCommand(tempFolder.root, "./my-home/hermes"))
  }

  @Test
  @WithOs(OS.MAC)
  fun detectOSAwareHermesCommand_withoutProvidedCommand_builtHermescTakesPrecedence() {
    // As we can't mock env variables, we skip this test if an override of the Hermes
    // path has been provided.
    assumeTrue(System.getenv("REACT_NATIVE_OVERRIDE_HERMES_DIR") == null)

    tempFolder.newFolder("node_modules/react-native/ReactAndroid/hermes-engine/build/hermes/bin/")
    val expected =
        tempFolder.newFile(
            "node_modules/react-native/ReactAndroid/hermes-engine/build/hermes/bin/hermesc")
    tempFolder.newFolder("node_modules/react-native/sdks/hermesc/osx-bin/")
    tempFolder.newFile("node_modules/react-native/sdks/hermesc/osx-bin/hermesc")

    assertEquals(expected.toString(), detectOSAwareHermesCommand(tempFolder.root, ""))
  }

  @Test
  fun getBuiltHermescFile_withoutOverride() {
    assertEquals(
        File(
            tempFolder.root,
            "node_modules/react-native/ReactAndroid/hermes-engine/build/hermes/bin/hermesc"),
        getBuiltHermescFile(tempFolder.root, ""))
  }

  @Test
  @WithOs(OS.WIN)
  fun getBuiltHermescFile_onWindows_withoutOverride() {
    assertEquals(
        File(
            tempFolder.root,
            "node_modules/react-native/ReactAndroid/hermes-engine/build/hermes/bin/hermesc.exe"),
        getBuiltHermescFile(tempFolder.root, ""))
  }

  @Test
  fun getBuiltHermescFile_withOverride() {
    assertEquals(
        File("/home/circleci/hermes/build/bin/hermesc"),
        getBuiltHermescFile(tempFolder.root, "/home/circleci/hermes"))
  }

  @Test
  @WithOs(OS.WIN)
  fun getHermesCBin_onWindows_returnsHermescExe() {
    assertEquals("hermesc.exe", getHermesCBin())
  }

  @Test
  @WithOs(OS.LINUX)
  fun getHermesCBin_onLinux_returnsHermesc() {
    assertEquals("hermesc", getHermesCBin())
  }

  @Test
  @WithOs(OS.MAC)
  fun getHermesCBin_onMac_returnsHermesc() {
    assertEquals("hermesc", getHermesCBin())
  }

  @Test
  fun findPackageJsonFile_withFileInParentFolder_picksItUp() {
    tempFolder.newFile("package.json")
    val moduleFolder = tempFolder.newFolder("awesome-module")

    val project = ProjectBuilder.builder().withProjectDir(moduleFolder).build()
    project.plugins.apply("com.android.library")
    project.plugins.apply("com.facebook.react")
    val extension = project.extensions.getByType(ReactExtension::class.java)

    assertEquals(project.file("../package.json"), findPackageJsonFile(project, extension))
  }

  @Test
  fun findPackageJsonFile_withFileConfiguredInExtension_picksItUp() {
    val moduleFolder = tempFolder.newFolder("awesome-module")
    val localFile = File(moduleFolder, "package.json").apply { writeText("{}") }

    val project = ProjectBuilder.builder().withProjectDir(moduleFolder).build()
    project.plugins.apply("com.android.library")
    project.plugins.apply("com.facebook.react")
    val extension =
        project.extensions.getByType(ReactExtension::class.java).apply { root.set(moduleFolder) }

    assertEquals(localFile, findPackageJsonFile(project, extension))
  }
}
