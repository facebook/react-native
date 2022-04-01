/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.tests.OS
import com.facebook.react.tests.OsRule
import com.facebook.react.tests.WithOs
import com.facebook.react.tests.createTestTask
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class GenerateCodegenArtifactsTaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @get:Rule val osRule = OsRule()

  @Test
  fun generateCodegenSchema_inputFiles_areSetCorrectly() {
    val codegenDir = tempFolder.newFolder("codegen")
    val outputDir = tempFolder.newFolder("output")

    val task =
        createTestTask<GenerateCodegenArtifactsTask> {
          it.codegenDir.set(codegenDir)
          it.generatedSrcDir.set(outputDir)
        }

    assertEquals(
        File(codegenDir, "lib/cli/combine/combine-js-to-schema-cli.js"),
        task.combineJsToSchemaCli.get().asFile)
    assertEquals(File(outputDir, "schema.json"), task.generatedSchemaFile.get().asFile)
  }

  @Test
  fun generateCodegenSchema_outputFile_isSetCorrectly() {
    val codegenDir = tempFolder.newFolder("codegen")
    val outputDir = tempFolder.newFolder("output")

    val task =
        createTestTask<GenerateCodegenArtifactsTask> {
          it.codegenDir.set(codegenDir)
          it.generatedSrcDir.set(outputDir)
        }

    assertEquals(File(outputDir, "java"), task.generatedJavaFiles.get().asFile)
    assertEquals(File(outputDir, "jni"), task.generatedJniFiles.get().asFile)
  }

  @Test
  fun generateCodegenSchema_simpleProperties_areInsideInput() {
    val task =
        createTestTask<GenerateCodegenArtifactsTask> {
          it.nodeExecutableAndArgs.set(listOf("npm", "help"))
          it.useJavaGenerator.set(true)
          it.codegenJavaPackageName.set("com.example.test")
          it.libraryName.set("example-test")
        }

    assertEquals(listOf("npm", "help"), task.nodeExecutableAndArgs.get())
    assertEquals(true, task.useJavaGenerator.get())
    assertEquals("com.example.test", task.codegenJavaPackageName.get())
    assertEquals("example-test", task.libraryName.get())
    assertTrue(task.inputs.properties.containsKey("nodeExecutableAndArgs"))
    assertTrue(task.inputs.properties.containsKey("useJavaGenerator"))
    assertTrue(task.inputs.properties.containsKey("codegenJavaPackageName"))
    assertTrue(task.inputs.properties.containsKey("libraryName"))
  }

  @Test
  @WithOs(OS.UNIX)
  fun setupCommandLine_withoutJavaGenerator_willSetupCorrectly() {
    val reactNativeDir = tempFolder.newFolder("node_modules/react-native/")
    val codegenDir = tempFolder.newFolder("codegen")
    val outputDir = tempFolder.newFolder("output")

    val task =
        createTestTask<GenerateCodegenArtifactsTask> {
          it.reactNativeDir.set(reactNativeDir)
          it.codegenDir.set(codegenDir)
          it.generatedSrcDir.set(outputDir)
          it.nodeExecutableAndArgs.set(listOf("--verbose"))
          it.codegenJavaPackageName.set("com.example.test")
          it.libraryName.set("example-test")
        }

    task.setupCommandLine()

    assertEquals(
        listOf(
            "yarn",
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
        ),
        task.commandLine.toMutableList())
  }
}
