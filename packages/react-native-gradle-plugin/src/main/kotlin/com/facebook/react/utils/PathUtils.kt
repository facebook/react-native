/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.facebook.react.ReactAppExtension
import java.io.File

/**
 * Computes the entry file for React Native. The Algo follows this order:
 * 1. The file pointed by the ENTRY_FILE env variable, if set.
 * 2. The file provided by the `entryFile` config in the `reactApp` Gradle extension
 * 3. The `index.android.js` file, if available.
 * 4. Fallback to the `index.js` file.
 *
 * @param config The [ReactAppExtension] configured for this project
 */
internal fun detectedEntryFile(config: ReactAppExtension): File =
    detectEntryFile(entryFile = config.entryFile, reactRoot = config.reactRoot)

/**
 * Computes the CLI location for React Native. The Algo follows this order:
 * 1. The path provided by the `cliPath` config in the `reactApp` Gradle extension
 * 2. The output of `node -e "console.log(require('react-native/cli').bin);"` if not failing.
 * 3. The `node_modules/react-native/cli.js` file if exists
 * 4. Fails otherwise
 */
internal fun detectedCliPath(
    projectDir: File,
    config: ReactAppExtension,
): String =
    detectCliPath(
        projectDir = projectDir, reactRoot = config.reactRoot, preconfuredCliPath = config.cliPath)

private fun detectEntryFile(entryFile: File?, reactRoot: File): File =
    when {
      System.getenv("ENTRY_FILE") != null -> File(System.getenv("ENTRY_FILE"))
      entryFile != null -> entryFile
      File(reactRoot, "index.android.js").exists() -> File(reactRoot, "index.android.js")
      else -> File(reactRoot, "index.js")
    }

private fun detectCliPath(projectDir: File, reactRoot: File, preconfuredCliPath: String?): String {
  // 1. preconfigured path
  if (preconfuredCliPath != null) return preconfuredCliPath

  // 2. node module path
  val nodeProcess =
      Runtime.getRuntime()
          .exec(
              arrayOf("node", "-e", "console.log(require('react-native/cli').bin);"),
              emptyArray(),
              projectDir)

  val nodeProcessOutput = nodeProcess.inputStream.use { it.bufferedReader().readText().trim() }

  if (nodeProcessOutput.isNotEmpty()) {
    return nodeProcessOutput
  }

  // 3. cli.js in the root folder
  val rootCliJs = File(reactRoot, "node_modules/react-native/cli.js")
  if (rootCliJs.exists()) {
    return rootCliJs.absolutePath
  }

  error(
      "Couldn't determine CLI location. " +
          "Please set `project.react.cliPath` to the path of the react-native cli.js")
}
