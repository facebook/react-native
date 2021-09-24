/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.codegen.generator.JavaGenerator
import com.facebook.react.utils.windowsAwareYarn
import org.gradle.api.GradleException
import org.gradle.api.file.Directory
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.file.RegularFile
import org.gradle.api.provider.ListProperty
import org.gradle.api.provider.Property
import org.gradle.api.provider.Provider
import org.gradle.api.tasks.*

abstract class GenerateCodegenArtifactsTask : Exec() {

  @get:Internal abstract val reactRoot: DirectoryProperty

  @get:Internal abstract val jsRootDir: DirectoryProperty

  @get:Internal abstract val codegenDir: DirectoryProperty

  @get:Internal abstract val generatedSrcDir: DirectoryProperty

  @get:Input abstract val nodeExecutableAndArgs: ListProperty<String>

  @get:Input abstract val useJavaGenerator: Property<Boolean>

  @get:Input abstract val codegenJavaPackageName: Property<String>

  @get:Input abstract val libraryName: Property<String>

  @get:InputFile
  val combineJsToSchemaCli: Provider<RegularFile> =
      codegenDir.file("lib/cli/combine/combine-js-to-schema-cli.js")

  @get:InputFile
  val generatedSchemaFile: Provider<RegularFile> = generatedSrcDir.file("schema.json")

  @get:OutputDirectory val generatedJavaFiles: Provider<Directory> = generatedSrcDir.dir("java")

  @get:OutputDirectory val generatedJniFiles: Provider<Directory> = generatedSrcDir.dir("jni")

  override fun exec() {
    commandLine(
        windowsAwareYarn(
            *nodeExecutableAndArgs.get().toTypedArray(),
            reactRoot.file("scripts/generate-specs-cli.js").get().asFile.absolutePath,
            "android",
            generatedSchemaFile.get().asFile.absolutePath,
            generatedSrcDir.get().asFile.absolutePath,
            libraryName.get(),
            codegenJavaPackageName.get()))
    super.exec()

    if (useJavaGenerator.getOrElse(false)) {
      // Use Java-based generator implementation to produce the source files,
      // instead of using the JS-based generator.
      try {
        JavaGenerator(
                generatedSchemaFile.get().asFile,
                codegenJavaPackageName.get(),
                generatedSrcDir.get().asFile)
            .build()
      } catch (e: Exception) {
        throw GradleException("Failed to generate Java from schema.", e)
      }
    }
  }
}
