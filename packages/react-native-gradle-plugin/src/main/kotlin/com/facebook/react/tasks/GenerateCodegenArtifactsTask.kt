/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.codegen.generator.JavaGenerator
import com.facebook.react.utils.windowsAwareCommandLine
import org.gradle.api.GradleException
import org.gradle.api.file.Directory
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.file.RegularFile
import org.gradle.api.provider.ListProperty
import org.gradle.api.provider.Property
import org.gradle.api.provider.Provider
import org.gradle.api.tasks.*

abstract class GenerateCodegenArtifactsTask : Exec() {

  @get:Internal abstract val reactNativeDir: DirectoryProperty

  @get:Internal abstract val codegenDir: DirectoryProperty

  @get:Internal abstract val generatedSrcDir: DirectoryProperty

  @get:Input abstract val nodeExecutableAndArgs: ListProperty<String>

  @get:Input abstract val useJavaGenerator: Property<Boolean>

  @get:Input abstract val codegenJavaPackageName: Property<String>

  @get:Input abstract val libraryName: Property<String>

  // We're keeping this just to fire a warning at the user should they use the `reactRoot` property.
  @get:Internal abstract val deprecatedReactRoot: DirectoryProperty

  @get:InputFile
  val combineJsToSchemaCli: Provider<RegularFile> =
      codegenDir.file("lib/cli/combine/combine-js-to-schema-cli.js")

  @get:InputFile
  val generatedSchemaFile: Provider<RegularFile> = generatedSrcDir.file("schema.json")

  @get:OutputDirectory val generatedJavaFiles: Provider<Directory> = generatedSrcDir.dir("java")

  @get:OutputDirectory val generatedJniFiles: Provider<Directory> = generatedSrcDir.dir("jni")

  override fun exec() {
    checkForDeprecatedProperty()
    setupCommandLine()
    super.exec()
    if (useJavaGenerator.getOrElse(false)) {
      // Use Java-based generator implementation to produce the source files,
      // this will override the JS-based generator output (for the Java files only).
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

  private fun checkForDeprecatedProperty() {
    if (deprecatedReactRoot.isPresent) {
      project.logger.error(
          """
        ********************************************************************************
        The `reactRoot` property is deprecated and will be removed in 
        future versions of React Native. The property is currently ignored.
        
        You should instead use either:
        - [root] to point to your root project (where the package.json lives)
        - [reactNativeDir] to point to the NPM package of react native.
        
        You should be fine by just removing the `reactRoot` line entirely from 
        your build.gradle file. Otherwise a valid configuration would look like:
        
        react {
            root = rootProject.file('..')
            reactNativeDir = rootProject.file('../node_modules/react-native')
        }
        ********************************************************************************
      """.trimIndent())
    }
  }

  internal fun setupCommandLine() {
    commandLine(
        windowsAwareCommandLine(
            *nodeExecutableAndArgs.get().toTypedArray(),
            reactNativeDir.file("scripts/generate-specs-cli.js").get().asFile.absolutePath,
            "--platform",
            "android",
            "--schemaPath",
            generatedSchemaFile.get().asFile.absolutePath,
            "--outputDir",
            generatedSrcDir.get().asFile.absolutePath,
            "--libraryName",
            libraryName.get(),
            "--javaPackageName",
            codegenJavaPackageName.get()))
  }
}
