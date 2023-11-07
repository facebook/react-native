/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.facebook.react.ReactExtension
import com.facebook.react.model.ModelPackageJson
import com.facebook.react.utils.KotlinStdlibCompatUtils.lowercaseCompat
import com.facebook.react.utils.KotlinStdlibCompatUtils.toBooleanStrictOrNullCompat
import com.facebook.react.utils.PropertyUtils.HERMES_ENABLED
import com.facebook.react.utils.PropertyUtils.NEW_ARCH_ENABLED
import com.facebook.react.utils.PropertyUtils.REACT_NATIVE_ARCHITECTURES
import com.facebook.react.utils.PropertyUtils.SCOPED_HERMES_ENABLED
import com.facebook.react.utils.PropertyUtils.SCOPED_NEW_ARCH_ENABLED
import com.facebook.react.utils.PropertyUtils.SCOPED_REACT_NATIVE_ARCHITECTURES
import java.io.File
import org.gradle.api.Project
import org.gradle.api.file.DirectoryProperty

internal object ProjectUtils {

  const val HERMES_FALLBACK = true

  internal fun Project.isNewArchEnabled(extension: ReactExtension): Boolean {
    return (project.hasProperty(NEW_ARCH_ENABLED) &&
        project.property(NEW_ARCH_ENABLED).toString().toBoolean()) ||
        (project.hasProperty(SCOPED_NEW_ARCH_ENABLED) &&
            project.property(SCOPED_NEW_ARCH_ENABLED).toString().toBoolean()) ||
        shouldEnableNewArchForReactNativeVersion(project.reactNativeDir(extension))
  }

  internal val Project.isHermesEnabled: Boolean
    get() =
        if (project.hasProperty(HERMES_ENABLED) || project.hasProperty(SCOPED_HERMES_ENABLED)) {
          val propertyString =
              if (project.hasProperty(HERMES_ENABLED)) {
                HERMES_ENABLED
              } else {
                SCOPED_HERMES_ENABLED
              }
          project
              .property(propertyString)
              .toString()
              .lowercaseCompat()
              .toBooleanStrictOrNullCompat() ?: true
        } else if (project.extensions.extraProperties.has("react")) {
          @Suppress("UNCHECKED_CAST")
          val reactMap = project.extensions.extraProperties.get("react") as? Map<String, Any?>
          when (val enableHermesKey = reactMap?.get("enableHermes")) {
            is Boolean -> enableHermesKey
            is String -> enableHermesKey.lowercaseCompat().toBooleanStrictOrNullCompat() ?: true
            else -> HERMES_FALLBACK
          }
        } else {
          HERMES_FALLBACK
        }

  internal fun Project.needsCodegenFromPackageJson(rootProperty: DirectoryProperty): Boolean {
    val parsedPackageJson = readPackageJsonFile(this, rootProperty)
    return needsCodegenFromPackageJson(parsedPackageJson)
  }

  internal fun Project.needsCodegenFromPackageJson(model: ModelPackageJson?): Boolean {
    return model?.codegenConfig != null
  }

  internal fun Project.getReactNativeArchitectures(): List<String> {
    val architectures = mutableListOf<String>()
    if (project.hasProperty(REACT_NATIVE_ARCHITECTURES)) {
      val architecturesString = project.property(REACT_NATIVE_ARCHITECTURES).toString()
      architectures.addAll(architecturesString.split(",").filter { it.isNotBlank() })
    } else if (project.hasProperty(SCOPED_REACT_NATIVE_ARCHITECTURES)) {
      val architecturesString = project.property(SCOPED_REACT_NATIVE_ARCHITECTURES).toString()
      architectures.addAll(architecturesString.split(",").filter { it.isNotBlank() })
    }
    return architectures
  }

  internal fun Project.reactNativeDir(extension: ReactExtension): String =
      extension.reactNativeDir.get().asFile.absolutePath

  internal fun shouldEnableNewArchForReactNativeVersion(reactNativeDir: String): Boolean {
    val packageJsonFile = File(reactNativeDir, "package.json")
    if (!packageJsonFile.exists()) {
      return false
    }

    val rnPackageJson = JsonUtils.fromPackageJson(packageJsonFile)
    if (rnPackageJson == null) {
      return false
    }

    // This regex describe the version syntax for React Native in the shape of
    // major.minor.patch[-<prerelease>[[-.]k]]
    // Where
    // major is a number
    // minor is a number
    // patch is a number
    // <prerelease>[-.]k is optional, but if present is preceeded by a `-`
    // the <prerelease> tag is a string.
    // it can be followed by `-` or `.` and k is a number.
    val regex = """^(\d+)\.(\d+)\.(\d+)(?:-(\w+(?:[-.]\d+)?))?$""".toRegex()

    val matchResult = regex.find(rnPackageJson.version)

    if (matchResult == null) {
      return false
    }

    val prerelease = matchResult.groupValues[4].toString()
    return prerelease.contains("prealpha")
  }

  internal fun Project.shouldWarnIfNewArchFlagIsSetInPrealpha(extension: ReactExtension): Boolean {

    val propertySetToFalse =
        (this.hasPropertySetToFalse(NEW_ARCH_ENABLED)) ||
            (this.hasPropertySetToFalse(SCOPED_NEW_ARCH_ENABLED))

    val shouldEnableNewArch =
        shouldEnableNewArchForReactNativeVersion(this.reactNativeDir(extension))

    return shouldEnableNewArch && propertySetToFalse
  }

  internal fun Project.hasPropertySetToFalse(property: String): Boolean =
      this.hasProperty(property) && this.property(property).toString().toBoolean() == false
}
