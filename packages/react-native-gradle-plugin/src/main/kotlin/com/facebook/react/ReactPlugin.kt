/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.android.build.gradle.AppExtension
import com.android.build.gradle.BaseExtension
import com.android.build.gradle.LibraryExtension
import com.android.build.gradle.internal.tasks.factory.dependsOn
import com.facebook.react.tasks.BuildCodegenCLITask
import com.facebook.react.tasks.GenerateCodegenArtifactsTask
import com.facebook.react.tasks.GenerateCodegenSchemaTask
import java.io.File
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.Task

class ReactPlugin : Plugin<Project> {
  override fun apply(project: Project) {
    val extension = project.extensions.create("react", ReactExtension::class.java, project)
    applyAppPlugin(project, extension)
    applyCodegenPlugin(project, extension)
  }

  private fun applyAppPlugin(project: Project, config: ReactExtension) {
    project.afterEvaluate {
      if (config.applyAppPlugin.getOrElse(false)) {
        val androidConfiguration = project.extensions.getByType(BaseExtension::class.java)
        project.configureDevPorts(androidConfiguration)

        val isAndroidLibrary = project.plugins.hasPlugin("com.android.library")
        val variants =
            if (isAndroidLibrary) {
              project.extensions.getByType(LibraryExtension::class.java).libraryVariants
            } else {
              project.extensions.getByType(AppExtension::class.java).applicationVariants
            }
        variants.all { project.configureReactTasks(variant = it, config = config) }
      }
    }
  }

  /**
   * A plugin to enable react-native-codegen in Gradle environment. See the Gradle API docs for more
   * information: https://docs.gradle.org/6.5.1/javadoc/org/gradle/api/Project.html
   */
  private fun applyCodegenPlugin(project: Project, extension: ReactExtension) {
    // 1. Set up build dir.
    val generatedSrcDir = File(project.buildDir, "generated/source/codegen")

    val buildCodegenTask =
        project.tasks.register("buildCodegenCLI", BuildCodegenCLITask::class.java) {
          it.codegenDir.set(extension.codegenDir)
          val bashWindowsHome = project.findProperty("REACT_WINDOWS_BASH") as String?
          it.bashWindowsHome.set(bashWindowsHome)
        }

    // 2. Task: produce schema from JS files.
    val generateCodegenSchemaTask =
        project.tasks.register(
            "generateCodegenSchemaFromJavaScript", GenerateCodegenSchemaTask::class.java) {
          it.dependsOn(buildCodegenTask)
          it.jsRootDir.set(extension.jsRootDir)
          it.nodeExecutableAndArgs.set(extension.nodeExecutableAndArgs)
          it.codegenDir.set(extension.codegenDir)
          it.generatedSrcDir.set(generatedSrcDir)
        }

    // 3. Task: generate Java code from schema.
    val generateCodegenArtifactsTask =
        project.tasks.register(
            "generateCodegenArtifactsFromSchema", GenerateCodegenArtifactsTask::class.java) {
          it.dependsOn(generateCodegenSchemaTask)
          it.reactRoot.set(extension.reactRoot)
          it.nodeExecutableAndArgs.set(extension.nodeExecutableAndArgs)
          it.codegenDir.set(extension.codegenDir)
          it.useJavaGenerator.set(extension.useJavaGenerator)
          it.codegenJavaPackageName.set(extension.codegenJavaPackageName)
          it.libraryName.set(extension.libraryName)
          it.generatedSrcDir.set(generatedSrcDir)
        }

    // 4. Add dependencies & generated sources to the project.
    // Note: This last step needs to happen after the project has been evaluated.
    project.afterEvaluate {

      // `preBuild` is one of the base tasks automatically registered by Gradle.
      // This will invoke the codegen before compiling the entire project.
      project.tasks.named("preBuild", Task::class.java).dependsOn(generateCodegenArtifactsTask)

      /**
       * Finally, update the android configuration to include the generated sources. This equivalent
       * to this DSL:
       *
       * android { sourceSets { main { java { srcDirs += "$generatedSrcDir/java" } } } }
       *
       * See documentation at
       * https://google.github.io/android-gradle-dsl/current/com.android.build.gradle.BaseExtension.html.
       */
      val android = project.extensions.getByName("android") as BaseExtension

      android.sourceSets.getByName("main").java.srcDir(File(generatedSrcDir, "java"))
    }
  }
}
