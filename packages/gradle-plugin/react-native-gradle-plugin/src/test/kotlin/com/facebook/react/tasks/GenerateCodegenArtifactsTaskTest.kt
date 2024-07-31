/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.tests.*
import com.facebook.react.tests.createProject
import com.facebook.react.tests.createTestTask
import java.io.File
import org.assertj.Assert.assertThat
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class GenerateCodegenArtifactsTaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @get:Rule val osRule = OsRule()

  @Test
  fun generateCodegenSchema_inputFiles_areSetCorrectly() {
    val outputDir = tempFolder.newFolder("output")

    val task = createTestTask<GenerateCodegenArtifactsTask> { it.generatedSrcDir.set(outputDir) }

    assertThat(File(outputDir, "schema.json")).isEqualTo(task.generatedSchemaFile.get().asFile)
  }

  @Test
  fun generateCodegenSchema_outputFile_isSetCorrectly() {
    val outputDir = tempFolder.newFolder("output")

    val task = createTestTask<GenerateCodegenArtifactsTask> { it.generatedSrcDir.set(outputDir) }

    assertThat(File(outputDir, "java")).isEqualTo(task.generatedJavaFiles.get().asFile)
    assertThat(File(outputDir, "jni")).isEqualTo(task.generatedJniFiles.get().asFile)
  }

  @Test
  fun generateCodegenSchema_simpleProperties_areInsideInput() {
    val packageJsonFile = tempFolder.newFile("package.json")

    val task =
        createTestTask<GenerateCodegenArtifactsTask> {
          it.nodeExecutableAndArgs.set(listOf("npm", "help"))
          it.codegenJavaPackageName.set("com.example.test")
          it.libraryName.set("example-test")
          it.packageJsonFile.set(packageJsonFile)
        }

    assertThat(listOf("npm", "help")).isEqualTo(task.nodeExecutableAndArgs.get())
    assertThat("com.example.test").isEqualTo(task.codegenJavaPackageName.get())
    assertThat("example-test").isEqualTo(task.libraryName.get())
    assertThat(task.inputs.properties.containsKey("nodeExecutableAndArgs")).exists()
    assertThat(task.inputs.properties.containsKey("codegenJavaPackageName")).exists()
    assertThat(task.inputs.properties.containsKey("libraryName")).exists()
  }

  @Test
  @WithOs(OS.LINUX)
  fun setupCommandLine_willSetupCorrectly() {
    val reactNativeDir = tempFolder.newFolder("node_modules/react-native/")
    val outputDir = tempFolder.newFolder("output")

    val task =
        createTestTask<GenerateCodegenArtifactsTask> {
          it.reactNativeDir.set(reactNativeDir)
          it.generatedSrcDir.set(outputDir)
          it.nodeExecutableAndArgs.set(listOf("--verbose"))
        }

    task.setupCommandLine("example-test", "com.example.test")

    assertThat(
        listOf(
            "--verbose",
            File(reactNativeDir, "scripts/generate-specs-cli.js").toString(),
            "--platform",
            "android",
            "--schemaPath",
            File(outputDir, "schema.json").toString(),
            "--outputDir",
            outputDir.toString(),
            "--libraryName",
            "example-test",
            "--javaPackageName",
            "com.example.test",
        )).isEqualTo(
        task.commandLine.toMutableList())
  }

  @Test
  @WithOs(OS.WIN)
  fun setupCommandLine_onWindows_willSetupCorrectly() {
    val reactNativeDir = tempFolder.newFolder("node_modules/react-native/")
    val outputDir = tempFolder.newFolder("output")

    val project = createProject()
    val task =
        createTestTask<GenerateCodegenArtifactsTask>(project) {
          it.reactNativeDir.set(reactNativeDir)
          it.generatedSrcDir.set(outputDir)
          it.nodeExecutableAndArgs.set(listOf("--verbose"))
        }

    task.setupCommandLine("example-test", "com.example.test")

    assertThat(
        listOf(
            "cmd",
            "/c",
            "--verbose",
            File(reactNativeDir, "scripts/generate-specs-cli.js")
                .relativeTo(project.projectDir)
                .path,
            "--platform",
            "android",
            "--schemaPath",
            File(outputDir, "schema.json").relativeTo(project.projectDir).path,
            "--outputDir",
            outputDir.relativeTo(project.projectDir).path,
            "--libraryName",
            "example-test",
            "--javaPackageName",
            "com.example.test",
        )).isEqualTo(
        task.commandLine.toMutableList())
  }

  @Test
  fun resolveTaskParameters_withConfigInPackageJson_usesIt() {
    val packageJsonFile =
        tempFolder.newFile("package.json").apply {
          // language=JSON
          writeText(
              """
        {
            "name": "@a/library",
            "codegenConfig": {
                "name": "an-awesome-library",
                "android": {
                  "javaPackageName": "com.awesome.package"
                }
            }
        }
        """
                  .trimIndent())
        }

    val task =
        createTestTask<GenerateCodegenArtifactsTask> {
          it.packageJsonFile.set(packageJsonFile)
          it.codegenJavaPackageName.set("com.example.ignored")
          it.libraryName.set("a-library-name-that-is-ignored")
        }

    val (libraryName, javaPackageName) = task.resolveTaskParameters()

    assertThat("an-awesome-library").isEqualTo(libraryName)
    assertThat("com.awesome.package").isEqualTo(javaPackageName)
  }

  @Test
  fun resolveTaskParameters_withConfigMissingInPackageJson_usesGradleOne() {
    val packageJsonFile =
        tempFolder.newFile("package.json").apply {
          // language=JSON
          writeText(
              """
        {
            "name": "@a/library",
            "codegenConfig": {
            }
        }
        """
                  .trimIndent())
        }

    val task =
        createTestTask<GenerateCodegenArtifactsTask> {
          it.packageJsonFile.set(packageJsonFile)
          it.codegenJavaPackageName.set("com.example.test")
          it.libraryName.set("a-library-name-from-gradle")
        }

    val (libraryName, javaPackageName) = task.resolveTaskParameters()

    assertThat("a-library-name-from-gradle").isEqualTo(libraryName)
    assertThat("com.example.test").isEqualTo(javaPackageName)
  }

  @Test
  fun resolveTaskParameters_withMissingPackageJson_usesGradleOne() {
    val task =
        createTestTask<GenerateCodegenArtifactsTask> {
          it.packageJsonFile.set(File(tempFolder.root, "package.json"))
          it.codegenJavaPackageName.set("com.example.test")
          it.libraryName.set("a-library-name-from-gradle")
        }

    val (libraryName, javaPackageName) = task.resolveTaskParameters()

    assertThat("a-library-name-from-gradle").isEqualTo(libraryName)
    assertThat("com.example.test").isEqualTo(javaPackageName)
  }
}
