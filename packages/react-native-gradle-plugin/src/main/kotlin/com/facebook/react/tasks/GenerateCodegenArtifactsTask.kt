/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.utils.JsonUtils
import com.facebook.react.utils.Os.cliPath
import com.facebook.react.utils.windowsAwareCommandLine
import org.gradle.api.file.Directory
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.file.RegularFile
import org.gradle.api.file.RegularFileProperty
import org.gradle.api.provider.ListProperty
import org.gradle.api.provider.Property
import org.gradle.api.provider.Provider
import org.gradle.api.tasks.Exec
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.InputFile
import org.gradle.api.tasks.Internal
import org.gradle.api.tasks.OutputDirectory

abstract class GenerateCodegenArtifactsTask : Exec() {

  @get:Internal abstract val reactNativeDir: DirectoryProperty

  @get:Internal abstract val generatedSrcDir: DirectoryProperty

  @get:InputFile abstract val packageJsonFile: RegularFileProperty

  @get:Input abstract val nodeExecutableAndArgs: ListProperty<String>

  @get:Input abstract val codegenJavaPackageName: Property<String>

  @get:Input abstract val libraryName: Property<String>

  @get:InputFile
  val generatedSchemaFile: Provider<RegularFile> = generatedSrcDir.file("schema.json")

  @get:OutputDirectory val generatedJavaFiles: Provider<Directory> = generatedSrcDir.dir("java")

  @get:OutputDirectory val generatedJniFiles: Provider<Directory> = generatedSrcDir.dir("jni")

  override fun exec() {
    val (resolvedLibraryName, resolvedCodegenJavaPackageName, cxxModules) = resolveTaskParameters()
    setupCommandLine(resolvedLibraryName, resolvedCodegenJavaPackageName, cxxModules)
    super.exec()
  }

  internal fun resolveTaskParameters(): List<String> {
    val parsedPackageJson =
        if (packageJsonFile.isPresent && packageJsonFile.get().asFile.exists()) {
          JsonUtils.fromPackageJson(packageJsonFile.get().asFile)
        } else {
          null
        }
    val resolvedLibraryName = parsedPackageJson?.codegenConfig?.name ?: libraryName.get()
    val resolvedCodegenJavaPackageName =
        parsedPackageJson?.codegenConfig?.android?.javaPackageName ?: codegenJavaPackageName.get()
    val cxxModules = parsedPackageJson?.codegenConfig?.cxxModules ?: emptyList()
    val separatedCxxModules = cxxModules.joinToString(":") { "${it.name}:${it.headerPath}" }
    return listOf(resolvedLibraryName, resolvedCodegenJavaPackageName, separatedCxxModules)
  }

  internal fun setupCommandLine(
      libraryName: String,
      codegenJavaPackageName: String,
      cxxModules: String
  ) {
    val workingDir = project.projectDir
    val generateSpecsCli =
        windowsAwareCommandLine(
                *nodeExecutableAndArgs.get().toTypedArray(),
                reactNativeDir
                    .file("scripts/generate-specs-cli.js")
                    .get()
                    .asFile
                    .cliPath(workingDir),
                "--platform",
                "android",
                "--schemaPath",
                generatedSchemaFile.get().asFile.cliPath(workingDir),
                "--outputDir",
                generatedSrcDir.get().asFile.cliPath(workingDir),
                "--libraryName",
                libraryName,
                "--javaPackageName",
                codegenJavaPackageName)
            .toMutableList()
    if (cxxModules.isNotBlank()) {
      generateSpecsCli.add("--cxxModules")
      generateSpecsCli.add(cxxModules)
    }
    commandLine(generateSpecsCli)
  }
}
