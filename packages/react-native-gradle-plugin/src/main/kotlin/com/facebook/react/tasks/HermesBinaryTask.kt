/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.utils.moveTo
import com.facebook.react.utils.windowsAwareCommandLine
import java.io.File
import org.gradle.api.DefaultTask
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.InputFile
import org.gradle.api.tasks.Internal
import org.gradle.api.tasks.OutputFile
import org.gradle.api.tasks.TaskAction

open class HermesBinaryTask : DefaultTask() {

  @get:Internal internal lateinit var reactRoot: File

  @get:Input internal lateinit var hermesCommand: String
  @get:Input internal var hermesFlags: List<String> = emptyList()
  @get:InputFile internal lateinit var jsBundleFile: File

  @get:Input internal lateinit var composeSourceMapsCommand: List<String>
  @get:InputFile internal lateinit var jsPackagerSourceMapFile: File

  @get:OutputFile internal lateinit var jsCompilerSourceMapFile: File
  @get:OutputFile internal lateinit var jsOutputSourceMapFile: File

  @TaskAction
  fun run() {
    val bytecodeTempFile = File("$jsBundleFile.hbc")
    emitHermesBinary(outputFile = bytecodeTempFile)
    bytecodeTempFile.moveTo(jsBundleFile)

    if (hermesFlags.contains("-output-source-map")) {
      val hermesTempSourceMapFile = File("$bytecodeTempFile.map")
      hermesTempSourceMapFile.moveTo(jsCompilerSourceMapFile)
      composeSourceMaps()
    }
  }

  private fun emitHermesBinary(outputFile: File) {
    project.exec {
      @Suppress("SpreadOperator")
      it.commandLine(
          windowsAwareCommandLine(
              hermesCommand,
              "-emit-binary",
              "-out",
              outputFile,
              jsBundleFile,
              *hermesFlags.toTypedArray()))
    }
  }

  private fun composeSourceMaps() {
    project.exec {
      it.workingDir(reactRoot)

      @Suppress("SpreadOperator")
      it.commandLine(
          windowsAwareCommandLine(
              *composeSourceMapsCommand.toTypedArray(),
              jsPackagerSourceMapFile,
              jsCompilerSourceMapFile,
              "-o",
              jsOutputSourceMapFile))
    }
  }
}
