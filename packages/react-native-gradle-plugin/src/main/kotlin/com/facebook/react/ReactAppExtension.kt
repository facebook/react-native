/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.android.build.gradle.api.BaseVariant
import java.io.File
import org.apache.tools.ant.taskdefs.condition.Os
import org.gradle.api.Project

open class ReactAppExtension(private val project: Project) {
  var composeSourceMapsPath: String = "node_modules/react-native/scripts/compose-source-maps.js"
  var bundleAssetName: String = "index.android.bundle"
  var entryFile: File? = null
  var bundleCommand: String = "bundle"
  var reactRoot: File = File(project.projectDir, "../../")
  var inputExcludes: List<String> = listOf("android/**", "ios/**")
  var bundleConfig: String? = null
  var enableVmCleanup: Boolean = true
  var hermesCommand: String = "node_modules/hermes-engine/%OS-BIN%/hermesc"
  var cliPath: String? = null
  var nodeExecutableAndArgs: List<String> = listOf("node")
  var enableHermes: Boolean = false
  var enableHermesForVariant: (BaseVariant) -> Boolean = { enableHermes }
  var devDisabledInVariants: List<String> = emptyList()
  // todo maybe lambda as for hermes?
  var bundleIn: Map<String, Boolean> = emptyMap()
  var extraPackagerArgs: List<String> = emptyList()
  var hermesFlagsDebug: List<String> = emptyList()
  var hermesFlagsRelease: List<String> = listOf("-O", "-output-source-map")
  var resourcesDir: Map<String, File> = emptyMap()
  var jsBundleDir: Map<String, File> = emptyMap()

  internal val osAwareHermesCommand: String
    get() = getOSAwareHermesCommand(hermesCommand)

  // Make sure not to inspect the Hermes config unless we need it,
  // to avoid breaking any JSC-only setups.
  private fun getOSAwareHermesCommand(hermesCommand: String): String {
    // If the project specifies a Hermes command, don't second guess it.
    if (!hermesCommand.contains("%OS-BIN%")) {
      return hermesCommand
    }

    // Execution on Windows fails with / as separator
    return hermesCommand.replace("%OS-BIN%", getHermesOSBin()).replace('/', File.separatorChar)
  }

  private fun getHermesOSBin(): String {
    if (Os.isFamily(Os.FAMILY_WINDOWS)) return "win64-bin"
    if (Os.isFamily(Os.FAMILY_MAC)) return "osx-bin"
    if (Os.isOs(null, "linux", "amd64", null)) return "linux64-bin"
    error(
        "OS not recognized. Please set project.react.hermesCommand " +
            "to the path of a working Hermes compiler.")
  }
}
