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
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class GenerateCodegenSchemaTaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @get:Rule val osRule = OsRule()

  @Test
  fun generateCodegenSchema_inputFiles_areSetCorrectly() {
    val jsRootDir =
        tempFolder.newFolder("js").apply {
          File(this, "file.js").createNewFile()
          File(this, "file.ts").createNewFile()
          File(this, "ignore.txt").createNewFile()
        }

    val task = createTestTask<GenerateCodegenSchemaTask> { it.jsRootDir.set(jsRootDir) }

    assertEquals(jsRootDir, task.jsInputFiles.dir)
    assertEquals(setOf("**/*.js", "**/*.ts"), task.jsInputFiles.includes)
    assertEquals(2, task.jsInputFiles.files.size)
    assertEquals(
        setOf(File(jsRootDir, "file.js"), File(jsRootDir, "file.ts")), task.jsInputFiles.files)
  }

  @Test
  fun generateCodegenSchema_inputFilesInExcludedPath_areExcluded() {
    fun File.createFileAndPath() {
      parentFile.mkdirs()
      createNewFile()
    }

    val jsRootDir =
        tempFolder.newFolder("js").apply {
          File(this, "afolder/includedfile.js").createFileAndPath()
          // Those files should be excluded due to their filepath
          File(this, "afolder/generated/source/codegen/anotherfolder/excludedfile.js")
              .createFileAndPath()
          File(this, "afolder/build/generated/assets/react/anotherfolder/excludedfile.js")
              .createFileAndPath()
          File(this, "afolder/build/generated/res/react/anotherfolder/excludedfile.js")
              .createFileAndPath()
          File(this, "afolder/build/generated/sourcemaps/react/anotherfolder/excludedfile.js")
              .createFileAndPath()
          File(this, "afolder/build/intermediates/sourcemaps/react/anotherfolder/excludedfile.js")
              .createFileAndPath()
        }

    val task = createTestTask<GenerateCodegenSchemaTask> { it.jsRootDir.set(jsRootDir) }

    assertEquals(jsRootDir, task.jsInputFiles.dir)
    assertEquals(
        setOf(
            "**/generated/source/codegen/**/*",
            "**/build/ASSETS/**/*",
            "**/build/RES/**/*",
            "**/build/generated/assets/react/**/*",
            "**/build/generated/res/react/**/*",
            "**/build/generated/sourcemaps/react/**/*",
            "**/build/intermediates/sourcemaps/react/**/*",
        ),
        task.jsInputFiles.excludes)
    assertEquals(1, task.jsInputFiles.files.size)
    assertEquals(setOf(File(jsRootDir, "afolder/includedfile.js")), task.jsInputFiles.files)
  }

  @Test
  fun generateCodegenSchema_outputFile_isSetCorrectly() {
    val outputDir = tempFolder.newFolder("output")

    val task = createTestTask<GenerateCodegenSchemaTask> { it.generatedSrcDir.set(outputDir) }

    assertEquals(File(outputDir, "schema.json"), task.generatedSchemaFile.get().asFile)
  }

  @Test
  fun generateCodegenSchema_nodeExecutablesArgs_areInsideInput() {
    val task =
        createTestTask<GenerateCodegenSchemaTask> {
          it.nodeExecutableAndArgs.set(listOf("npm", "help"))
        }

    assertEquals(listOf("npm", "help"), task.nodeExecutableAndArgs.get())
    assertTrue(task.inputs.properties.containsKey("nodeExecutableAndArgs"))
  }

  @Test
  fun wipeOutputDir_willCreateOutputDir() {
    val task =
        createTestTask<GenerateCodegenSchemaTask> {
          it.generatedSrcDir.set(File(tempFolder.root, "output"))
        }

    task.wipeOutputDir()

    assertTrue(File(tempFolder.root, "output").exists())
    assertEquals(0, File(tempFolder.root, "output").listFiles()?.size)
  }

  @Test
  fun wipeOutputDir_willWipeOutputDir() {
    val outputDir =
        tempFolder.newFolder("output").apply { File(this, "some-generated-file").createNewFile() }

    val task = createTestTask<GenerateCodegenSchemaTask> { it.generatedSrcDir.set(outputDir) }

    task.wipeOutputDir()

    assertTrue(outputDir.exists())
    assertEquals(0, outputDir.listFiles()?.size)
  }

  @Test
  @WithOs(OS.LINUX)
  fun setupCommandLine_willSetupCorrectly() {
    val codegenDir = tempFolder.newFolder("codegen")
    val jsRootDir = tempFolder.newFolder("js")
    val outputDir = tempFolder.newFolder("output")

    val task =
        createTestTask<GenerateCodegenSchemaTask> {
          it.codegenDir.set(codegenDir)
          it.jsRootDir.set(jsRootDir)
          it.generatedSrcDir.set(outputDir)
          it.nodeExecutableAndArgs.set(listOf("--verbose"))
        }

    task.setupCommandLine()

    assertEquals(
        listOf(
            "--verbose",
            File(codegenDir, "lib/cli/combine/combine-js-to-schema-cli.js").toString(),
            "--platform",
            "android",
            File(outputDir, "schema.json").toString(),
            jsRootDir.toString(),
        ),
        task.commandLine.toMutableList())
  }
}
