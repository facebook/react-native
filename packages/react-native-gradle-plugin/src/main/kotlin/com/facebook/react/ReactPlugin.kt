/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.android.build.api.variant.AndroidComponentsExtension
import com.android.build.gradle.internal.tasks.factory.dependsOn
import com.facebook.react.internal.PrivateReactExtension
import com.facebook.react.tasks.GenerateCodegenArtifactsTask
import com.facebook.react.tasks.GenerateCodegenSchemaTask
import com.facebook.react.utils.AgpConfiguratorUtils.configureBuildConfigFieldsForApp
import com.facebook.react.utils.AgpConfiguratorUtils.configureBuildConfigFieldsForLibraries
import com.facebook.react.utils.AgpConfiguratorUtils.configureDevPorts
import com.facebook.react.utils.AgpConfiguratorUtils.configureNamespaceForLibraries
import com.facebook.react.utils.BackwardCompatUtils.configureBackwardCompatibilityReactMap
import com.facebook.react.utils.DependencyUtils.configureDependencies
import com.facebook.react.utils.DependencyUtils.configureRepositories
import com.facebook.react.utils.DependencyUtils.readVersionAndGroupStrings
import com.facebook.react.utils.JdkConfiguratorUtils.configureJavaToolChains
import com.facebook.react.utils.JsonUtils
import com.facebook.react.utils.NdkConfiguratorUtils.configureReactNativeNdk
import com.facebook.react.utils.ProjectUtils.needsCodegenFromPackageJson
import com.facebook.react.utils.findPackageJsonFile
import java.io.File
import kotlin.system.exitProcess
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.Task
import org.gradle.api.file.Directory
import org.gradle.api.provider.Provider
import org.gradle.internal.jvm.Jvm

class ReactPlugin : Plugin<Project> {
  override fun apply(project: Project) {
    checkJvmVersion(project)
    val extension = project.extensions.create("react", ReactExtension::class.java, project)

    // We register a private extension on the rootProject so that project wide configs
    // like codegen config can be propagated from app project to libraries.
    val rootExtension =
        project.rootProject.extensions.findByType(PrivateReactExtension::class.java)
            ?: project.rootProject.extensions.create(
                "privateReact", PrivateReactExtension::class.java, project)

    // App Only Configuration
    project.pluginManager.withPlugin("com.android.application") {
      // We wire the root extension with the values coming from the app (either user populated or
      // defaults).
      rootExtension.root.set(extension.root)
      rootExtension.reactNativeDir.set(extension.reactNativeDir)
      rootExtension.codegenDir.set(extension.codegenDir)
      rootExtension.nodeExecutableAndArgs.set(extension.nodeExecutableAndArgs)

      project.afterEvaluate {
        val reactNativeDir = extension.reactNativeDir.get().asFile
        val propertiesFile = File(reactNativeDir, "ReactAndroid/gradle.properties")
        val versionAndGroupStrings = readVersionAndGroupStrings(propertiesFile)
        val versionString = versionAndGroupStrings.first
        val groupString = versionAndGroupStrings.second
        configureDependencies(project, versionString, groupString)
        configureRepositories(project, reactNativeDir)
      }

      configureReactNativeNdk(project, extension)
      configureBuildConfigFieldsForApp(project, extension)
      configureDevPorts(project)
      configureBackwardCompatibilityReactMap(project)
      configureJavaToolChains(project)

      project.extensions.getByType(AndroidComponentsExtension::class.java).apply {
        onVariants(selector().all()) { variant ->
          project.configureReactTasks(variant = variant, config = extension)
        }
      }
      configureCodegen(project, extension, rootExtension, isLibrary = false)
    }

    // Library Only Configuration
    configureBuildConfigFieldsForLibraries(project)
    configureNamespaceForLibraries(project)
    project.pluginManager.withPlugin("com.android.library") {
      configureCodegen(project, extension, rootExtension, isLibrary = true)
    }
  }

  private fun checkJvmVersion(project: Project) {
    val jvmVersion = Jvm.current()?.javaVersion?.majorVersion
    if ((jvmVersion?.toIntOrNull() ?: 0) <= 16) {
      project.logger.error(
          """

      ********************************************************************************

      ERROR: requires JDK17 or higher.
      Incompatible major version detected: '$jvmVersion'

      ********************************************************************************

      """
              .trimIndent())
      exitProcess(1)
    }
  }

  /** This function sets up `react-native-codegen` in our Gradle plugin. */
  @Suppress("UnstableApiUsage")
  private fun configureCodegen(
      project: Project,
      localExtension: ReactExtension,
      rootExtension: PrivateReactExtension,
      isLibrary: Boolean
  ) {
    // First, we set up the output dir for the codegen.
    val generatedSrcDir: Provider<Directory> =
        project.layout.buildDirectory.dir("generated/source/codegen")

    // We specify the default value (convention) for jsRootDir.
    // It's the root folder for apps (so ../../ from the Gradle project)
    // and the package folder for library (so ../ from the Gradle project)
    if (isLibrary) {
      localExtension.jsRootDir.convention(project.layout.projectDirectory.dir("../"))
    } else {
      localExtension.jsRootDir.convention(localExtension.root)
    }

    // We create the task to produce schema from JS files.
    val generateCodegenSchemaTask =
        project.tasks.register(
            "generateCodegenSchemaFromJavaScript", GenerateCodegenSchemaTask::class.java) { it ->
              it.nodeExecutableAndArgs.set(rootExtension.nodeExecutableAndArgs)
              it.codegenDir.set(rootExtension.codegenDir)
              it.generatedSrcDir.set(generatedSrcDir)

              // We're reading the package.json at configuration time to properly feed
              // the `jsRootDir` @Input property of this task & the onlyIf. Therefore, the
              // parsePackageJson should be invoked inside this lambda.
              val packageJson = findPackageJsonFile(project, rootExtension.root)
              val parsedPackageJson = packageJson?.let { JsonUtils.fromPackageJson(it) }

              val jsSrcsDirInPackageJson = parsedPackageJson?.codegenConfig?.jsSrcsDir
              if (jsSrcsDirInPackageJson != null) {
                it.jsRootDir.set(File(packageJson.parentFile, jsSrcsDirInPackageJson))
              } else {
                it.jsRootDir.set(localExtension.jsRootDir)
              }
              val needsCodegenFromPackageJson =
                  project.needsCodegenFromPackageJson(rootExtension.root)
              it.onlyIf { isLibrary || needsCodegenFromPackageJson }
            }

    // We create the task to generate Java code from schema.
    val generateCodegenArtifactsTask =
        project.tasks.register(
            "generateCodegenArtifactsFromSchema", GenerateCodegenArtifactsTask::class.java) {
              it.dependsOn(generateCodegenSchemaTask)
              it.reactNativeDir.set(rootExtension.reactNativeDir)
              it.nodeExecutableAndArgs.set(rootExtension.nodeExecutableAndArgs)
              it.generatedSrcDir.set(generatedSrcDir)
              it.packageJsonFile.set(findPackageJsonFile(project, rootExtension.root))
              it.codegenJavaPackageName.set(localExtension.codegenJavaPackageName)
              it.libraryName.set(localExtension.libraryName)

              // Please note that appNeedsCodegen is triggering a read of the package.json at
              // configuration time as we need to feed the onlyIf condition of this task.
              // Therefore, the appNeedsCodegen needs to be invoked inside this lambda.
              val needsCodegenFromPackageJson =
                  project.needsCodegenFromPackageJson(rootExtension.root)
              it.onlyIf { isLibrary || needsCodegenFromPackageJson }
            }

    // We update the android configuration to include the generated sources.
    // This equivalent to this DSL:
    //
    // android { sourceSets { main { java { srcDirs += "$generatedSrcDir/java" } } } }
    project.extensions.getByType(AndroidComponentsExtension::class.java).finalizeDsl { ext ->
      ext.sourceSets.getByName("main").java.srcDir(generatedSrcDir.get().dir("java").asFile)
    }

    // `preBuild` is one of the base tasks automatically registered by AGP.
    // This will invoke the codegen before compiling the entire project.
    project.tasks.named("preBuild", Task::class.java).dependsOn(generateCodegenArtifactsTask)
  }
}
