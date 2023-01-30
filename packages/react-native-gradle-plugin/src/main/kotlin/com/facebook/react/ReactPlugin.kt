/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.android.build.api.variant.AndroidComponentsExtension
import com.android.build.gradle.AppExtension
import com.android.build.gradle.internal.tasks.factory.dependsOn
import com.facebook.react.tasks.BuildCodegenCLITask
import com.facebook.react.tasks.GenerateCodegenArtifactsTask
import com.facebook.react.tasks.GenerateCodegenSchemaTask
import com.facebook.react.utils.AgpConfiguratorUtils.configureBuildConfigFields
import com.facebook.react.utils.AgpConfiguratorUtils.configureDevPorts
import com.facebook.react.utils.BackwardCompatUtils.configureBackwardCompatibilityReactMap
import com.facebook.react.utils.DependencyUtils.configureDependencies
import com.facebook.react.utils.DependencyUtils.configureRepositories
import com.facebook.react.utils.DependencyUtils.readVersionString
import com.facebook.react.utils.JsonUtils
import com.facebook.react.utils.NdkConfiguratorUtils.configureReactNativeNdk
import com.facebook.react.utils.ProjectUtils.needsCodegenFromPackageJson
import com.facebook.react.utils.findPackageJsonFile
import java.io.File
import kotlin.system.exitProcess
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.Task
import org.gradle.internal.jvm.Jvm

class ReactPlugin : Plugin<Project> {
  override fun apply(project: Project) {
    checkJvmVersion(project)
    val extension = project.extensions.create("react", ReactExtension::class.java, project)

    // App Only Configuration
    project.pluginManager.withPlugin("com.android.application") {
      project.afterEvaluate {
        val reactNativeDir = extension.reactNativeDir.get().asFile
        val propertiesFile = File(reactNativeDir, "ReactAndroid/gradle.properties")
        val versionString = readVersionString(propertiesFile)
        configureDependencies(project, versionString)
        configureRepositories(project, reactNativeDir)
      }

      configureReactNativeNdk(project, extension)
      configureBuildConfigFields(project)
      configureDevPorts(project)
      configureBackwardCompatibilityReactMap(project)

      project.extensions.getByType(AndroidComponentsExtension::class.java).apply {
        onVariants(selector().all()) { variant ->
          project.configureReactTasks(variant = variant, config = extension)
        }
      }

      // This is a legacy AGP api. Needed as AGP 7.3 is not consuming generated resources correctly.
      // Can be removed as we bump to AGP 7.4 stable.
      // This registers the $buildDir/generated/res/react/<variant> folder as a
      // res folder to be consumed with the old AGP Apis which are not broken.
      project.extensions.getByType(AppExtension::class.java).apply {
        this.applicationVariants.all { variant ->
          val isDebuggableVariant =
              extension.debuggableVariants.get().any { it.equals(variant.name, ignoreCase = true) }
          val targetName = variant.name.replaceFirstChar { it.uppercase() }
          val bundleTaskName = "createBundle${targetName}JsAndAssets"
          if (!isDebuggableVariant) {
            variant.registerGeneratedResFolders(
                project.layout.buildDirectory.files("generated/res/react/${variant.name}"))
            variant.mergeResourcesProvider.get().dependsOn(bundleTaskName)
          }
        }
      }
      configureCodegen(project, extension, isLibrary = false)
    }

    // Library Only Configuration
    project.pluginManager.withPlugin("com.android.library") {
      configureCodegen(project, extension, isLibrary = true)
    }
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

      """
              .trimIndent())
      exitProcess(1)
    }
  }

  /**
   * A plugin to enable react-native-codegen in Gradle environment. See the Gradle API docs for more
   * information: https://docs.gradle.org/current/javadoc/org/gradle/api/Project.html
   */
  @Suppress("UnstableApiUsage")
  private fun configureCodegen(project: Project, extension: ReactExtension, isLibrary: Boolean) {
    // First, we set up the output dir for the codegen.
    val generatedSrcDir = File(project.buildDir, "generated/source/codegen")

    // We specify the default value (convention) for jsRootDir.
    // It's the root folder for apps (so ../../ from the Gradle project)
    // and the package folder for library (so ../ from the Gradle project)
    if (isLibrary) {
      extension.jsRootDir.convention(project.layout.projectDirectory.dir("../"))
    } else {
      extension.jsRootDir.convention(extension.root)
    }

    val buildCodegenTask =
        project.tasks.register("buildCodegenCLI", BuildCodegenCLITask::class.java) {
          it.codegenDir.set(extension.codegenDir)
          val bashWindowsHome = project.findProperty("REACT_WINDOWS_BASH") as String?
          it.bashWindowsHome.set(bashWindowsHome)

          // Please note that appNeedsCodegen is triggering a read of the package.json at
          // configuration time as we need to feed the onlyIf condition of this task.
          // Therefore, the appNeedsCodegen needs to be invoked inside this lambda.
          val needsCodegenFromPackageJson = project.needsCodegenFromPackageJson(extension)
          it.onlyIf { isLibrary || needsCodegenFromPackageJson }
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
              // the `jsRootDir` @Input property of this task & the onlyIf. Therefore, the
              // parsePackageJson should be invoked inside this lambda.
              val packageJson = findPackageJsonFile(project, extension)
              val parsedPackageJson = packageJson?.let { JsonUtils.fromCodegenJson(it) }

              val jsSrcsDirInPackageJson = parsedPackageJson?.codegenConfig?.jsSrcsDir
              if (jsSrcsDirInPackageJson != null) {
                it.jsRootDir.set(File(packageJson.parentFile, jsSrcsDirInPackageJson))
              } else {
                it.jsRootDir.set(extension.jsRootDir)
              }
              val needsCodegenFromPackageJson = project.needsCodegenFromPackageJson(extension)
              it.onlyIf { isLibrary || needsCodegenFromPackageJson }
            }

    // We create the task to generate Java code from schema.
    val generateCodegenArtifactsTask =
        project.tasks.register(
            "generateCodegenArtifactsFromSchema", GenerateCodegenArtifactsTask::class.java) {
              it.dependsOn(generateCodegenSchemaTask)
              it.reactNativeDir.set(extension.reactNativeDir)
              it.nodeExecutableAndArgs.set(extension.nodeExecutableAndArgs)
              it.generatedSrcDir.set(generatedSrcDir)
              it.packageJsonFile.set(findPackageJsonFile(project, extension))
              it.codegenJavaPackageName.set(extension.codegenJavaPackageName)
              it.libraryName.set(extension.libraryName)

              // Please note that appNeedsCodegen is triggering a read of the package.json at
              // configuration time as we need to feed the onlyIf condition of this task.
              // Therefore, the appNeedsCodegen needs to be invoked inside this lambda.
              val needsCodegenFromPackageJson = project.needsCodegenFromPackageJson(extension)
              it.onlyIf { isLibrary || needsCodegenFromPackageJson }
            }

    // We update the android configuration to include the generated sources.
    // This equivalent to this DSL:
    //
    // android { sourceSets { main { java { srcDirs += "$generatedSrcDir/java" } } } }
    project.extensions.getByType(AndroidComponentsExtension::class.java).finalizeDsl { ext ->
      ext.sourceSets.getByName("main").java.srcDir(File(generatedSrcDir, "java"))
    }

    // `preBuild` is one of the base tasks automatically registered by AGP.
    // This will invoke the codegen before compiling the entire project.
    project.tasks.named("preBuild", Task::class.java).dependsOn(generateCodegenArtifactsTask)
  }
}
