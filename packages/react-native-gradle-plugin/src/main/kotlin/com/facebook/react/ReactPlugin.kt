/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.android.build.api.variant.AndroidComponentsExtension
import com.android.build.gradle.AppExtension
import com.android.build.gradle.BaseExtension
import com.android.build.gradle.LibraryExtension
import com.android.build.gradle.internal.tasks.factory.dependsOn
import com.facebook.react.tasks.BuildCodegenCLITask
import com.facebook.react.tasks.GenerateCodegenArtifactsTask
import com.facebook.react.tasks.GenerateCodegenSchemaTask
import com.facebook.react.utils.JsonUtils
import com.facebook.react.utils.findPackageJsonFile
import java.io.File
import kotlin.system.exitProcess
import org.gradle.api.Action
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.Task
import org.gradle.internal.jvm.Jvm

class ReactPlugin : Plugin<Project> {
  override fun apply(project: Project) {
    checkJvmVersion(project)
    val extension = project.extensions.create("react", ReactExtension::class.java, project)
    applyAppPlugin(project, extension)
    applyCodegenPlugin(project, extension)
  }

  private fun checkJvmVersion(project: Project) {
    val jvmVersion = Jvm.current()?.javaVersion?.majorVersion
    if ((jvmVersion?.toIntOrNull() ?: 0) <= 8) {
      project.logger.error(
          """
      
      ********************************************************************************
      
      ERROR: requires JDK11 or higher.
      Incompatible major version detected: '$jvmVersion'
      
      ********************************************************************************
      
      """.trimIndent())
      exitProcess(1)
    }
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
   * information: https://docs.gradle.org/current/javadoc/org/gradle/api/Project.html
   */
  @Suppress("UnstableApiUsage")
  private fun applyCodegenPlugin(project: Project, extension: ReactExtension) {
    // First, we set up the output dir for the codegen.
    val generatedSrcDir = File(project.buildDir, "generated/source/codegen")

    val buildCodegenTask =
        project.tasks.register("buildCodegenCLI", BuildCodegenCLITask::class.java) {
          it.codegenDir.set(extension.codegenDir)
          val bashWindowsHome = project.findProperty("REACT_WINDOWS_BASH") as String?
          it.bashWindowsHome.set(bashWindowsHome)
        }

    // We create the task to produce schema from JS files.
    val generateCodegenSchemaTask =
        project.tasks.register(
            "generateCodegenSchemaFromJavaScript", GenerateCodegenSchemaTask::class.java) { it ->
              it.dependsOn(buildCodegenTask)
              it.nodeExecutableAndArgs.set(extension.nodeExecutableAndArgs)
              it.codegenDir.set(extension.codegenDir)
              it.generatedSrcDir.set(generatedSrcDir)

              // We're reading the package.json at configuration time to properly feed
              // the `jsRootDir` @Input property of this task. Therefore, the
              // parsePackageJson should be invoked inside this lambda.
              val packageJson = findPackageJsonFile(project, extension)
              val parsedPackageJson = packageJson?.let { JsonUtils.fromCodegenJson(it) }

              val jsSrcsDirInPackageJson = parsedPackageJson?.codegenConfig?.jsSrcsDir
              if (jsSrcsDirInPackageJson != null) {
                it.jsRootDir.set(File(packageJson.parentFile, jsSrcsDirInPackageJson))
              } else {
                it.jsRootDir.set(extension.jsRootDir)
              }
            }

    // We create the task to generate Java code from schema.
    val generateCodegenArtifactsTask =
        project.tasks.register(
            "generateCodegenArtifactsFromSchema", GenerateCodegenArtifactsTask::class.java) {
              it.dependsOn(generateCodegenSchemaTask)
              it.reactNativeDir.set(extension.reactNativeDir)
              it.deprecatedReactRoot.set(extension.reactRoot)
              it.nodeExecutableAndArgs.set(extension.nodeExecutableAndArgs)
              it.codegenDir.set(extension.codegenDir)
              it.generatedSrcDir.set(generatedSrcDir)
              it.packageJsonFile.set(findPackageJsonFile(project, extension))
              it.codegenJavaPackageName.set(extension.codegenJavaPackageName)
              it.libraryName.set(extension.libraryName)
            }

    // We update the android configuration to include the generated sources.
    // This equivalent to this DSL:
    //
    // android { sourceSets { main { java { srcDirs += "$generatedSrcDir/java" } } } }
    project.extensions.getByType(AndroidComponentsExtension::class.java).finalizeDsl { ext ->
      ext.sourceSets.getByName("main").java.srcDir(File(generatedSrcDir, "java"))
    }

    // `preBuild` is one of the base tasks automatically registered by Gradle.
    // This will invoke the codegen before compiling the entire project.
    val androidPluginHandler = Action { _: Plugin<*> ->
      project.tasks.named("preBuild", Task::class.java).dependsOn(generateCodegenArtifactsTask)
    }
    project.plugins.withId("com.android.application", androidPluginHandler)
    project.plugins.withId("com.android.library", androidPluginHandler)
  }
}
