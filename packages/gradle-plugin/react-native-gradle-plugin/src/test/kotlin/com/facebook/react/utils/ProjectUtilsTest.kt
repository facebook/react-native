/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.facebook.react.TestReactExtension
import com.facebook.react.model.ModelCodegenConfig
import com.facebook.react.model.ModelPackageJson
import com.facebook.react.tests.createProject
import com.facebook.react.utils.ProjectUtils.getReactNativeArchitectures
import com.facebook.react.utils.ProjectUtils.isHermesEnabled
import com.facebook.react.utils.ProjectUtils.isNewArchEnabled
import com.facebook.react.utils.ProjectUtils.needsCodegenFromPackageJson
import com.facebook.react.utils.ProjectUtils.shouldWarnIfNewArchFlagIsSetInPrealpha
import java.io.File
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class ProjectUtilsTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun isNewArchEnabled_returnsFalseByDefault() {
    val project = createProject()
    val extension = TestReactExtension(project)
    assertFalse(createProject().isNewArchEnabled(extension))
  }

  @Test
  fun isNewArchEnabled_withDisabled_returnsFalse() {
    val project = createProject()
    project.extensions.extraProperties.set("newArchEnabled", "false")
    val extension = TestReactExtension(project)
    assertFalse(project.isNewArchEnabled(extension))
  }

  @Test
  fun isNewArchEnabled_withEnabled_returnsTrue() {
    val project = createProject()
    project.extensions.extraProperties.set("newArchEnabled", "true")
    val extension = TestReactExtension(project)
    assertTrue(project.isNewArchEnabled(extension))
  }

  @Test
  fun isNewArchEnabled_withInvalid_returnsFalse() {
    val project = createProject()
    project.extensions.extraProperties.set("newArchEnabled", "¯\\_(ツ)_/¯")
    val extension = TestReactExtension(project)
    assertFalse(project.isNewArchEnabled(extension))
  }

  @Test
  fun isNewArchEnabled_withRNVersion0_returnFalse() {
    val project = createProject()
    val extension = TestReactExtension(project)
    File(tempFolder.root, "package.json").apply {
      writeText(
          // language=json
          """
      {
        "version": "0.73.0"
      }
      """
              .trimIndent())
    }
    extension.reactNativeDir.set(tempFolder.root)
    assertFalse(project.isNewArchEnabled(extension))
  }

  @Test
  fun isNewArchEnabled_withRNVersionPrealpha_returnTrue() {
    val project = createProject()
    val extension = TestReactExtension(project)
    File(tempFolder.root, "package.json").apply {
      writeText(
          // language=json
          """
      {
        "version": "0.0.0-prealpha-202310916"
      }
      """
              .trimIndent())
    }
    extension.reactNativeDir.set(tempFolder.root)
    assertTrue(project.isNewArchEnabled(extension))
  }

  @Test
  fun isNewArchEnabled_withRNVersion1PrereleaseString_returnTrue() {
    val project = createProject()
    val extension = TestReactExtension(project)
    File(tempFolder.root, "package.json").apply {
      writeText(
          // language=json
          """
      {
        "version": "1.2.3-prealpha0"
      }
      """
              .trimIndent())
    }
    extension.reactNativeDir.set(tempFolder.root)
    assertTrue(project.isNewArchEnabled(extension))
  }

  @Test
  fun isNewArchEnabled_withRNVersion1PrereleaseStringDotNumber_returnTrue() {
    val project = createProject()
    val extension = TestReactExtension(project)
    File(tempFolder.root, "package.json").apply {
      writeText(
          // language=json
          """
      {
        "version": "1.2.3-prealpha.0"
      }
      """
              .trimIndent())
    }
    extension.reactNativeDir.set(tempFolder.root)
    assertTrue(project.isNewArchEnabled(extension))
  }

  @Test
  fun isNewArchEnabled_withRNVersion1PrereleaseStringDashNumber_returnTrue() {
    val project = createProject()
    val extension = TestReactExtension(project)
    File(tempFolder.root, "package.json").apply {
      writeText(
          // language=json
          """
      {
        "version": "1.2.3-prealpha-0"
      }
      """
              .trimIndent())
    }
    extension.reactNativeDir.set(tempFolder.root)
    assertTrue(project.isNewArchEnabled(extension))
  }

  @Test
  fun isNewArchEnabled_withRNVersion1000_returnFalse() {
    val project = createProject()
    val extension = TestReactExtension(project)
    File(tempFolder.root, "package.json").apply {
      writeText(
          // language=json
          """
      {
        "version": "1000.0.0"
      }
      """
              .trimIndent())
    }
    extension.reactNativeDir.set(tempFolder.root)
    assertFalse(project.isNewArchEnabled(extension))
  }

  @Test
  fun isHermesEnabled_returnsTrueByDefault() {
    assertTrue(createProject().isHermesEnabled)
  }

  @Test
  fun isNewArchEnabled_withDisabledViaProperty_returnsFalse() {
    val project = createProject()
    project.extensions.extraProperties.set("hermesEnabled", "false")
    assertFalse(project.isHermesEnabled)
  }

  @Test
  fun isHermesEnabled_withEnabledViaProperty_returnsTrue() {
    val project = createProject()
    project.extensions.extraProperties.set("hermesEnabled", "true")
    assertTrue(project.isHermesEnabled)
  }

  @Test
  fun isHermesEnabled_withInvalidViaProperty_returnsTrue() {
    val project = createProject()
    project.extensions.extraProperties.set("hermesEnabled", "¯\\_(ツ)_/¯")
    assertTrue(project.isHermesEnabled)
  }

  @Test
  fun isHermesEnabled_withDisabledViaExt_returnsFalse() {
    val project = createProject()
    val extMap = mapOf("enableHermes" to false)
    project.extensions.extraProperties.set("react", extMap)
    assertFalse(project.isHermesEnabled)
  }

  @Test
  fun isHermesEnabled_withEnabledViaExt_returnsTrue() {
    val project = createProject()
    val extMap = mapOf("enableHermes" to true)
    project.extensions.extraProperties.set("react", extMap)
    assertTrue(project.isHermesEnabled)
  }

  @Test
  fun isHermesEnabled_withDisabledViaExtAsString_returnsFalse() {
    val project = createProject()
    val extMap = mapOf("enableHermes" to "false")
    project.extensions.extraProperties.set("react", extMap)
    assertFalse(project.isHermesEnabled)
  }

  @Test
  fun isHermesEnabled_withInvalidViaExt_returnsTrue() {
    val project = createProject()
    val extMap = mapOf("enableHermes" to "¯\\_(ツ)_/¯")
    project.extensions.extraProperties.set("react", extMap)
    assertTrue(project.isHermesEnabled)
  }

  @Test
  fun needsCodegenFromPackageJson_withCodegenConfigInPackageJson_returnsTrue() {
    val project = createProject()
    val extension = TestReactExtension(project)
    File(tempFolder.root, "package.json").apply {
      writeText(
          // language=json
          """
      {
        "name": "a-library",
        "codegenConfig": {}
      }
      """
              .trimIndent())
    }
    extension.root.set(tempFolder.root)
    assertTrue(project.needsCodegenFromPackageJson(extension.root))
  }

  @Test
  fun needsCodegenFromPackageJson_withMissingCodegenConfigInPackageJson_returnsFalse() {
    val project = createProject()
    val extension = TestReactExtension(project)
    File(tempFolder.root, "package.json").apply {
      writeText(
          // language=json
          """
      {
        "name": "a-library"
      }
      """
              .trimIndent())
    }
    extension.root.set(tempFolder.root)
    assertFalse(project.needsCodegenFromPackageJson(extension.root))
  }

  @Test
  fun needsCodegenFromPackageJson_withCodegenConfigInModel_returnsTrue() {
    val project = createProject()
    val model = ModelPackageJson("1000.0.0", ModelCodegenConfig(null, null, null, null, false))

    assertTrue(project.needsCodegenFromPackageJson(model))
  }

  @Test
  fun needsCodegenFromPackageJson_withMissingCodegenConfigInModel_returnsFalse() {
    val project = createProject()
    val model = ModelPackageJson("1000.0.0", null)

    assertFalse(project.needsCodegenFromPackageJson(model))
  }

  @Test
  fun needsCodegenFromPackageJson_withMissingPackageJson_returnsFalse() {
    val project = createProject()
    val extension = TestReactExtension(project)

    assertFalse(project.needsCodegenFromPackageJson(extension.root))
  }

  @Test
  fun getReactNativeArchitectures_withMissingProperty_returnsEmptyList() {
    val project = createProject()
    assertTrue(project.getReactNativeArchitectures().isEmpty())
  }

  @Test
  fun getReactNativeArchitectures_withEmptyProperty_returnsEmptyList() {
    val project = createProject()
    project.extensions.extraProperties.set("reactNativeArchitectures", "")
    assertTrue(project.getReactNativeArchitectures().isEmpty())
  }

  @Test
  fun getReactNativeArchitectures_withSingleArch_returnsSingleton() {
    val project = createProject()
    project.extensions.extraProperties.set("reactNativeArchitectures", "x86")

    val archs = project.getReactNativeArchitectures()
    assertEquals(1, archs.size)
    assertEquals("x86", archs[0])
  }

  @Test
  fun getReactNativeArchitectures_withMultipleArch_returnsList() {
    val project = createProject()
    project.extensions.extraProperties.set(
        "reactNativeArchitectures", "armeabi-v7a,arm64-v8a,x86,x86_64")

    val archs = project.getReactNativeArchitectures()
    assertEquals(4, archs.size)
    assertEquals("armeabi-v7a", archs[0])
    assertEquals("arm64-v8a", archs[1])
    assertEquals("x86", archs[2])
    assertEquals("x86_64", archs[3])
  }

  @Test
  fun shouldWarnIfNewArchFlagIsSetInPrealpha_whenNewArchIsSetToFalseAndOnPrealpha_returnTrue() {
    val project = createProject()
    project.extensions.extraProperties.set("newArchEnabled", "false")
    val extension = TestReactExtension(project)
    File(tempFolder.root, "package.json").apply {
      writeText(
          // language=json
          """
      {
        "version": "0.0.0-prealpha-2023100915"
      }
      """
              .trimIndent())
    }
    extension.reactNativeDir.set(tempFolder.root)
    assertTrue(project.shouldWarnIfNewArchFlagIsSetInPrealpha(extension))
  }

  @Test
  fun shouldWarnIfNewArchFlagIsSetInPrealpha_whenScopedNewArchIsSetToFalseAndOnPrealpha_returnTrue() {
    val project = createProject()
    project.extensions.extraProperties.set("react.newArchEnabled", "false")
    val extension = TestReactExtension(project)
    File(tempFolder.root, "package.json").apply {
      writeText(
          // language=json
          """
      {
        "version": "0.0.0-prealpha-2023100915"
      }
      """
              .trimIndent())
    }
    extension.reactNativeDir.set(tempFolder.root)
    assertTrue(project.shouldWarnIfNewArchFlagIsSetInPrealpha(extension))
  }

  @Test
  fun shouldWarnIfNewArchFlagIsSetInPrealpha_whenBothAreSetToFalseAndOnPrealpha_returnTrue() {
    val project = createProject()
    project.extensions.extraProperties.set("newArchEnabled", "false")
    project.extensions.extraProperties.set("react.newArchEnabled", "false")
    val extension = TestReactExtension(project)
    File(tempFolder.root, "package.json").apply {
      writeText(
          // language=json
          """
      {
        "version": "0.0.0-prealpha-2023100915"
      }
      """
              .trimIndent())
    }
    extension.reactNativeDir.set(tempFolder.root)
    assertTrue(project.shouldWarnIfNewArchFlagIsSetInPrealpha(extension))
  }

  @Test
  fun shouldWarnIfNewArchFlagIsSetInPrealpha_whenNewArchIsSetToTrueAndOnPrealpha_returnFalse() {
    val project = createProject()
    project.extensions.extraProperties.set("newArchEnabled", "true")
    val extension = TestReactExtension(project)
    File(tempFolder.root, "package.json").apply {
      writeText(
          // language=json
          """
      {
        "version": "0.0.0-prealpha-2023100915"
      }
      """
              .trimIndent())
    }
    extension.reactNativeDir.set(tempFolder.root)
    assertFalse(project.shouldWarnIfNewArchFlagIsSetInPrealpha(extension))
  }

  @Test
  fun shouldWarnIfNewArchFlagIsSetInPrealpha_whenScopedNewArchIsSetToTrueAndOnPrealpha_returnFalse() {
    val project = createProject()
    project.extensions.extraProperties.set("react.newArchEnabled", "true")
    val extension = TestReactExtension(project)
    File(tempFolder.root, "package.json").apply {
      writeText(
          // language=json
          """
      {
        "version": "0.0.0-prealpha-2023100915"
      }
      """
              .trimIndent())
    }
    extension.reactNativeDir.set(tempFolder.root)
    assertFalse(project.shouldWarnIfNewArchFlagIsSetInPrealpha(extension))
  }

  @Test
  fun shouldWarnIfNewArchFlagIsSetInPrealpha_whenBothAreSetToTrueAndOnPrealpha_returnFalse() {
    val project = createProject()
    project.extensions.extraProperties.set("newArchEnabled", "true")
    project.extensions.extraProperties.set("react.newArchEnabled", "true")
    val extension = TestReactExtension(project)
    File(tempFolder.root, "package.json").apply {
      writeText(
          // language=json
          """
      {
        "version": "0.0.0-prealpha-2023100915"
      }
      """
              .trimIndent())
    }
    extension.reactNativeDir.set(tempFolder.root)
    assertFalse(project.shouldWarnIfNewArchFlagIsSetInPrealpha(extension))
  }

  @Test
  fun shouldWarnIfNewArchFlagIsSetInPrealpha_whenNoneAreSetAndOnPrealpha_returnFalse() {
    val project = createProject()
    val extension = TestReactExtension(project)
    File(tempFolder.root, "package.json").apply {
      writeText(
          // language=json
          """
      {
        "version": "0.0.0-prealpha-2023100915"
      }
      """
              .trimIndent())
    }
    extension.reactNativeDir.set(tempFolder.root)
    assertFalse(project.shouldWarnIfNewArchFlagIsSetInPrealpha(extension))
  }

  @Test
  fun shouldWarnIfNewArchFlagIsSetInPrealpha_whenNewArchIsSetToTrueAndNotOnPrealpha_returnFalse() {
    val project = createProject()
    project.extensions.extraProperties.set("newxArchEnabled", "true")
    val extension = TestReactExtension(project)
    File(tempFolder.root, "package.json").apply {
      writeText(
          // language=json
          """
      {
        "version": "0.73.0"
      }
      """
              .trimIndent())
    }
    extension.reactNativeDir.set(tempFolder.root)
    assertFalse(project.shouldWarnIfNewArchFlagIsSetInPrealpha(extension))
  }

  @Test
  fun shouldWarnIfNewArchFlagIsSetInPrealpha_whenScopedNewArchIsSetToTrueAndNotOnPrealpha_returnFalse() {
    val project = createProject()
    project.extensions.extraProperties.set("react.newxArchEnabled", "true")
    val extension = TestReactExtension(project)
    File(tempFolder.root, "package.json").apply {
      writeText(
          // language=json
          """
      {
        "version": "0.73.0"
      }
      """
              .trimIndent())
    }
    extension.reactNativeDir.set(tempFolder.root)
    assertFalse(project.shouldWarnIfNewArchFlagIsSetInPrealpha(extension))
  }

  @Test
  fun shouldWarnIfNewArchFlagIsSetInPrealpha_whenBothAreSetToTrueAndNotOnPrealpha_returnFalse() {
    val project = createProject()
    project.extensions.extraProperties.set("newArchEnabled", "true")
    project.extensions.extraProperties.set("react.newxArchEnabled", "true")
    val extension = TestReactExtension(project)
    File(tempFolder.root, "package.json").apply {
      writeText(
          // language=json
          """
      {
        "version": "0.73.0"
      }
      """
              .trimIndent())
    }
    extension.reactNativeDir.set(tempFolder.root)
    assertFalse(project.shouldWarnIfNewArchFlagIsSetInPrealpha(extension))
  }

  @Test
  fun shouldWarnIfNewArchFlagIsSetInPrealpha_whenNoneAreSetAndNotOnPrealpha_returnFalse() {
    val project = createProject()
    val extension = TestReactExtension(project)
    File(tempFolder.root, "package.json").apply {
      writeText(
          // language=json
          """
      {
        "version": "0.73.0"
      }
      """
              .trimIndent())
    }
    extension.reactNativeDir.set(tempFolder.root)
    assertFalse(project.shouldWarnIfNewArchFlagIsSetInPrealpha(extension))
  }
}
