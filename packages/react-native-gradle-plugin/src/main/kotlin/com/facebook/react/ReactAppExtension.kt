/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.android.build.gradle.api.BaseVariant
import java.io.File
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
}
