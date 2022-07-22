/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:JvmName("PathUtils")

package com.facebook.react.utils

import com.facebook.react.ReactExtension
import java.io.File

/**
 * Computes the entry file for React Native. The Algo follows this order:
 * 1. The file pointed by the ENTRY_FILE env variable, if set.
 * 2. The file provided by the `entryFile` config in the `reactApp` Gradle extension
 * 3. The `index.android.js` file, if available.
 * 4. Fallback to the `index.js` file.
 *
 * @param config The [ReactExtension] configured for this project
 */
internal fun detectedEntryFile(config: ReactExtension): File =
    detectEntryFile(
        entryFile = config.entryFile.orNull?.asFile, reactRoot = config.root.get().asFile)

/**
 * Computes the CLI location for React Native. The Algo follows this order:
 * 1. The path provided by the `cliPath` config in the `reactApp` Gradle extension
 * 2. The output of `node -e "console.log(require('react-native/cli').bin);"` if not failing.
 * 3. The `node_modules/react-native/cli.js` file if exists
 * 4. Fails otherwise
 */
internal fun detectedCliPath(
    projectDir: File,
    config: ReactExtension,
): String =
    detectCliPath(
        projectDir = projectDir,
        reactRoot = config.root.get().asFile,
        preconfiguredCliPath = config.cliPath.orNull)

/**
 * Computes the `hermesc` command location. The Algo follows this order:
 * 1. The path provided by the `hermesCommand` config in the `react` Gradle extension
 * 2. The file located in `node_modules/react-native/sdks/hermes/build/bin/hermesc`. This will be
 * used if the user is building Hermes from source.
 * 3. The file located in `node_modules/react-native/sdks/hermesc/%OS-BIN%/hermesc` where `%OS-BIN%`
 * is substituted with the correct OS arch. This will be used if the user is using a precompiled
 * hermes-engine package.
 * 4. Fails otherwise
 */
internal fun detectedHermesCommand(config: ReactExtension): String =
    detectOSAwareHermesCommand(config.root.get().asFile, config.hermesCommand.get())

private fun detectEntryFile(entryFile: File?, reactRoot: File): File =
    when {
      System.getenv("ENTRY_FILE") != null -> File(System.getenv("ENTRY_FILE"))
      entryFile != null -> entryFile
      File(reactRoot, "index.android.js").exists() -> File(reactRoot, "index.android.js")
      else -> File(reactRoot, "index.js")
    }

private fun detectCliPath(
    projectDir: File,
    reactRoot: File,
    preconfiguredCliPath: String?
): String {
  // 1. preconfigured path
  if (preconfiguredCliPath != null) {
    val preconfiguredCliJsAbsolute = File(preconfiguredCliPath)
    if (preconfiguredCliJsAbsolute.exists()) {
      return preconfiguredCliJsAbsolute.absolutePath
    }
    val preconfiguredCliJsRelativeToReactRoot = File(reactRoot, preconfiguredCliPath)
    if (preconfiguredCliJsRelativeToReactRoot.exists()) {
      return preconfiguredCliJsRelativeToReactRoot.absolutePath
    }
    val preconfiguredCliJsRelativeToProject = File(projectDir, preconfiguredCliPath)
    if (preconfiguredCliJsRelativeToProject.exists()) {
      return preconfiguredCliJsRelativeToProject.absolutePath
    }
  }

  // 2. node module path
  val nodeProcess =
      Runtime.getRuntime()
          .exec(
              arrayOf("node", "-e", "console.log(require('react-native/cli').bin);"),
              emptyArray(),
              projectDir)

  val nodeProcessOutput = nodeProcess.inputStream.use { it.bufferedReader().readText().trim() }

  if (nodeProcessOutput.isNotEmpty()) {
    val nodeModuleCliJs = File(nodeProcessOutput)
    if (nodeModuleCliJs.exists()) {
      return nodeModuleCliJs.absolutePath
    }
  }

  // 3. cli.js in the root folder
  val rootCliJs = File(reactRoot, "node_modules/react-native/cli.js")
  if (rootCliJs.exists()) {
    return rootCliJs.absolutePath
  }

  error(
      "Couldn't determine CLI location. " +
          "Please set `project.react.cliPath` to the path of the react-native cli.js file. " +
          "This file typically resides in `node_modules/react-native/cli.js`")
}

/**
 * Computes the `hermesc` command location. The Algo follows this order:
 * 1. The path provided by the `hermesCommand` config in the `react` Gradle extension
 * 2. The file located in `node_modules/react-native/sdks/hermes/build/bin/hermesc`. This will be
 * used if the user is building Hermes from source.
 * 3. The file located in `node_modules/react-native/sdks/hermesc/%OS-BIN%/hermesc` where `%OS-BIN%`
 * is substituted with the correct OS arch. This will be used if the user is using a precompiled
 * hermes-engine package.
 * 4. Fails otherwise
 */
internal fun detectOSAwareHermesCommand(projectRoot: File, hermesCommand: String): String {
  // 1. If the project specifies a Hermes command, don't second guess it.
  if (hermesCommand.isNotBlank()) {
    val osSpecificHermesCommand =
        if ("%OS-BIN%" in hermesCommand) {
          hermesCommand.replace("%OS-BIN%", getHermesOSBin())
        } else {
          hermesCommand
        }
    return osSpecificHermesCommand
        // Execution on Windows fails with / as separator
        .replace('/', File.separatorChar)
  }

  // 2. If the project is building hermes-engine from source, use hermesc from there
  val builtHermesc =
      getBuiltHermescFile(projectRoot, System.getenv("REACT_NATIVE_OVERRIDE_HERMES_DIR"))
  if (builtHermesc.exists()) {
    return builtHermesc.absolutePath
  }

  // 3. If the react-native contains a pre-built hermesc, use it.
  val prebuiltHermesPath =
      HERMESC_IN_REACT_NATIVE_PATH.replace("%OS-BIN%", getHermesOSBin())
          // Execution on Windows fails with / as separator
          .replace('/', File.separatorChar)

  val prebuiltHermes = File(projectRoot, prebuiltHermesPath)
  if (prebuiltHermes.exists()) {
    return prebuiltHermes.absolutePath
  }

  error(
      "Couldn't determine Hermesc location. " +
          "Please set `react.hermesCommand` to the path of the hermesc binary file. " +
          "node_modules/react-native/sdks/hermesc/%OS-BIN%/hermesc")
}

/**
 * Gets the location where Hermesc should be. If nothing is specified, built hermesc is assumed to
 * be inside [HERMESC_BUILT_FROM_SOURCE_PATH]. Otherwise user can specify an override with
 * [pathOverride], which is assumed to be an absolute path where Hermes source code is
 * provided/built.
 *
 * @param projectRoot The root of the Project.
 */
internal fun getBuiltHermescFile(projectRoot: File, pathOverride: String?) =
    if (!pathOverride.isNullOrBlank()) {
      File(pathOverride, "build/bin/hermesc")
    } else {
      File(projectRoot, HERMESC_BUILT_FROM_SOURCE_PATH)
    }

internal fun getHermesOSBin(): String {
  if (Os.isWindows()) return "win64-bin"
  if (Os.isMac()) return "osx-bin"
  if (Os.isLinuxAmd64()) return "linux64-bin"
  error(
      "OS not recognized. Please set project.react.hermesCommand " +
          "to the path of a working Hermes compiler.")
}

internal fun projectPathToLibraryName(projectPath: String): String =
    projectPath
        .split(':', '-', '_', '.')
        .joinToString("") { token -> token.replaceFirstChar { it.uppercase() } }
        .plus("Spec")

private const val HERMESC_IN_REACT_NATIVE_PATH =
    "node_modules/react-native/sdks/hermesc/%OS-BIN%/hermesc"
private const val HERMESC_BUILT_FROM_SOURCE_PATH =
    "node_modules/react-native/ReactAndroid/hermes-engine/build/hermes/bin/hermesc"
