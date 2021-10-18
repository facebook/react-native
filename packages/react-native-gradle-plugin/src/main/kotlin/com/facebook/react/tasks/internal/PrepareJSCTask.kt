/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks.internal

import java.io.File
import org.gradle.api.DefaultTask
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.provider.Property
import org.gradle.api.tasks.*

/**
 * A task that takes care of unbundling JSC and preparing it for be consumed by the Android NDK.
 * Specifically it will unbundle shared libs, headers and will copy over the Makefile from
 * `src/main/jni/third-party/jsc/`
 */
abstract class PrepareJSCTask : DefaultTask() {

  @get:Input abstract val jscPackagePath: Property<String>

  @get:OutputDirectory abstract val outputDir: DirectoryProperty

  @TaskAction
  fun taskAction() {
    if (!jscPackagePath.isPresent || jscPackagePath.orNull == null) {
      error("Could not find the jsc-android npm package")
    }
    val jscDist = File(jscPackagePath.get(), "dist")
    if (!jscDist.exists()) {
      error("The jsc-android npm package is missing its \"dist\" directory")
    }
    val jscAAR =
        project.fileTree(jscDist).matching { it.include("**/android-jsc/**/*.aar") }.singleFile
    val soFiles = project.zipTree(jscAAR).matching { it.include("**/*.so") }
    val headerFiles = project.fileTree(jscDist).matching { it.include("**/include/*.h") }

    project.copy { it ->
      it.from(soFiles)
      it.from(headerFiles)
      it.from(project.file("src/main/jni/third-party/jsc/Android.mk"))
      it.filesMatching("**/*.h") { it.path = "JavaScriptCore/${it.name}" }
      it.includeEmptyDirs = false
      it.into(outputDir)
    }
  }
}
