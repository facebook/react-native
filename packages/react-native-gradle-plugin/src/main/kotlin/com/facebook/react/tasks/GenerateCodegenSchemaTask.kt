/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.utils.windowsAwareYarn
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
abstract class GenerateCodegenSchemaTask : Exec() {

  @get:Internal abstract val jsRootDir: DirectoryProperty

  @get:Internal abstract val codegenDir: DirectoryProperty

  @get:Internal abstract val generatedSrcDir: DirectoryProperty

  @get:Input abstract val nodeExecutableAndArgs: ListProperty<String>

  @get:InputFiles val jsInputFiles = project.fileTree(jsRootDir) { it.include("**/*.js") }

  @get:OutputFile
  val generatedSchemaFile: Provider<RegularFile> = generatedSrcDir.file("schema.json")

  override fun exec() {
    wipeOutputDir()
    setupCommandLine()
    super.exec()
  }

  internal fun wipeOutputDir() {
    generatedSrcDir.asFile.get().apply {
      deleteRecursively()
      mkdirs()
    }
  }

  internal fun setupCommandLine() {
    commandLine(
        windowsAwareYarn(
            *nodeExecutableAndArgs.get().toTypedArray(),
            codegenDir
                .file("lib/cli/combine/combine-js-to-schema-cli.js")
                .get()
                .asFile
                .absolutePath,
            generatedSchemaFile.get().asFile.absolutePath,
            jsRootDir.asFile.get().absolutePath,
        ))
  }
}
