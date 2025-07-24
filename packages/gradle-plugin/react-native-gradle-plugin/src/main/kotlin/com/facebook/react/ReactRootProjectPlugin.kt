/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import org.gradle.api.Plugin
import org.gradle.api.Project

/**
 * Gradle plugin applied to the `android/build.gradle` file.
 *
 * This plugin allows to specify project wide configurations that can be applied to both apps and
 * libraries before they're evaluated.
 */
class ReactRootProjectPlugin : Plugin<Project> {
  override fun apply(project: Project) {
    project.subprojects {
      // As the :app project (i.e. ReactPlugin) configures both namespaces and JVM toolchains
      // for libraries, its evaluation must happen before the libraries' evaluation.
      // Eventually the configuration of namespace/JVM toolchain can be moved inside this plugin.
      if (it.path != ":app") {
        it.evaluationDependsOn(":app")
      }
    }
    // We need to make sure that `:app:preBuild` task depends on all other subprojects' preBuild
    // tasks. This is necessary in order to have all the codegen generated code before the CMake
    // configuration build kicks in.
    project.gradle.projectsEvaluated {
      val appProject = project.rootProject.subprojects.find { it.name == "app" }
      val appPreBuild = appProject?.tasks?.findByName("preBuild")
      if (appPreBuild != null) {
        // Find all other subprojects' preBuild tasks
        val otherPreBuildTasks =
            project.rootProject.subprojects
                .filter { it != appProject }
                .mapNotNull { it.tasks.findByName("preBuild") }
        // Make :app:preBuild depend on all others
        appPreBuild.dependsOn(otherPreBuildTasks)
      }
    }
  }
}
