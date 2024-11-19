/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.utils.Os.cliPath
import com.facebook.react.utils.windowsAwareCommandLine
import org.gradle.api.DefaultTask
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.file.RegularFile
import org.gradle.api.provider.ListProperty
import org.gradle.api.provider.Provider
import org.gradle.api.tasks.*

/**
 * A task that will collect all the *.js files inside the provided [jsRootDir] and will run the
 * `combine-js-to-schema-cli.js` on top of it (from `react-native-codegen`). The output is a
 * `schema.json` file that contains an intermediate representation of the code to be generated.
 */
abstract class GenerateCodegenSchemaTask : DefaultTask() {

  @get:Internal abstract val jsRootDir: DirectoryProperty

  @get:Internal abstract val generatedSrcDir: DirectoryProperty

  @get:Input abstract val nodeExecutableAndArgs: ListProperty<String>

  @get:InputFiles
  val jsInputFiles =
      project.fileTree(jsRootDir) {
        it.include("**/*.js")
        it.include("**/*.ts")
        // We want to exclude the build directory, to don't pick them up for execution avoidance.
        it.exclude("**/build/**/*")
      }

  @get:OutputFile
  val generatedSchemaFile: Provider<RegularFile> = generatedSrcDir.file("schema.json")

  @TaskAction
  fun run() {
    val codegenCombineScriptPath = resolveCodegenCombineScriptPath()
    val codegenCombineCommand = getCodegenCombineCommand(codegenCombineScriptPath)

    wipeOutputDir()
    runCommand(codegenCombineCommand)
  }

  internal fun wipeOutputDir() {
    generatedSrcDir.asFile.get().apply {
      deleteRecursively()
      mkdirs()
    }
  }

  private fun runCommand(command: List<Any>) {
    project.exec {
      it.workingDir(project.projectDir)
      it.commandLine(command)
    }
  }

  internal fun getCodegenCombineCommand(codegenCombineScriptPath: String): List<Any> {
    val workingDir = project.projectDir
    val command =
        mutableListOf<String>().apply {
          addAll(nodeExecutableAndArgs.get())
          add(codegenCombineScriptPath)
          add("--platform")
          add("android")
          add("--exclude")
          add("NativeSampleTurboModule")
          add(generatedSchemaFile.get().asFile.cliPath(workingDir))
          add(jsRootDir.asFile.get().cliPath(workingDir))
        }

    return windowsAwareCommandLine(command)
  }

  private fun resolveCodegenCombineScriptPath(): String {
    val nodeProcess =
        Runtime.getRuntime()
            .exec(
                arrayOf(
                    "node",
                    "--print",
                    "require.resolve('@react-native/codegen/cli/combine/combine-js-to-schema-cli.js');"))

    return nodeProcess.inputStream.use { it.bufferedReader().readText().trim() }
  }
}
