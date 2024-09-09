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
import org.assertj.core.api.Assertions.assertThat
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class ProjectUtilsTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun isNewArchEnabled_returnsFalseByDefault() {
    val project = createProject()
    val extension = TestReactExtension(project)
    assertThat(createProject().isNewArchEnabled(extension)).isFalse()
  }

  @Test
  fun isNewArchEnabled_withDisabled_returnsFalse() {
    val project = createProject()
    project.extensions.extraProperties.set("newArchEnabled", "false")
    val extension = TestReactExtension(project)
    assertThat(project.isNewArchEnabled(extension)).isFalse()
  }

  @Test
  fun isNewArchEnabled_withEnabled_returnsTrue() {
    val project = createProject()
    project.extensions.extraProperties.set("newArchEnabled", "true")
    val extension = TestReactExtension(project)
    assertThat(project.isNewArchEnabled(extension)).isTrue()
  }

  @Test
  fun isNewArchEnabled_withInvalid_returnsFalse() {
    val project = createProject()
    project.extensions.extraProperties.set("newArchEnabled", "¯\\_(ツ)_/¯")
    val extension = TestReactExtension(project)
    assertThat(project.isNewArchEnabled(extension)).isFalse()
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
    assertThat(project.isNewArchEnabled(extension)).isFalse()
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
    assertThat(project.isNewArchEnabled(extension)).isTrue()
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
    assertThat(project.isNewArchEnabled(extension)).isTrue()
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
    assertThat(project.isNewArchEnabled(extension)).isTrue()
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
    assertThat(project.isNewArchEnabled(extension)).isTrue()
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
    assertThat(project.isNewArchEnabled(extension)).isFalse()
  }

  @Test
  fun isHermesEnabled_returnsTrueByDefault() {
    assertThat(createProject().isHermesEnabled).isTrue()
  }

  @Test
  fun isNewArchEnabled_withDisabledViaProperty_returnsFalse() {
    val project = createProject()
    project.extensions.extraProperties.set("hermesEnabled", "false")
    assertThat(project.isHermesEnabled).isFalse()
  }

  @Test
  fun isHermesEnabled_withEnabledViaProperty_returnsTrue() {
    val project = createProject()
    project.extensions.extraProperties.set("hermesEnabled", "true")
    assertThat(project.isHermesEnabled).isTrue()
  }

  @Test
  fun isHermesEnabled_withInvalidViaProperty_returnsTrue() {
    val project = createProject()
    project.extensions.extraProperties.set("hermesEnabled", "¯\\_(ツ)_/¯")
    assertThat(project.isHermesEnabled).isTrue()
  }

  @Test
  fun isHermesEnabled_withDisabledViaExt_returnsFalse() {
    val project = createProject()
    val extMap = mapOf("enableHermes" to false)
    project.extensions.extraProperties.set("react", extMap)
    assertThat(project.isHermesEnabled).isFalse()
  }

  @Test
  fun isHermesEnabled_withEnabledViaExt_returnsTrue() {
    val project = createProject()
    val extMap = mapOf("enableHermes" to true)
    project.extensions.extraProperties.set("react", extMap)
    assertThat(project.isHermesEnabled).isTrue()
  }

  @Test
  fun isHermesEnabled_withDisabledViaExtAsString_returnsFalse() {
    val project = createProject()
    val extMap = mapOf("enableHermes" to "false")
    project.extensions.extraProperties.set("react", extMap)
    assertThat(project.isHermesEnabled).isFalse()
  }

  @Test
  fun isHermesEnabled_withInvalidViaExt_returnsTrue() {
    val project = createProject()
    val extMap = mapOf("enableHermes" to "¯\\_(ツ)_/¯")
    project.extensions.extraProperties.set("react", extMap)
    assertThat(project.isHermesEnabled).isTrue()
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
    assertThat(project.needsCodegenFromPackageJson(extension.root)).isTrue()
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
    assertThat(project.needsCodegenFromPackageJson(extension.root)).isFalse()
  }

  @Test
  fun needsCodegenFromPackageJson_withCodegenConfigInModel_returnsTrue() {
    val project = createProject()
    val model = ModelPackageJson("1000.0.0", ModelCodegenConfig(null, null, null, null, false))

    assertThat(project.needsCodegenFromPackageJson(model)).isTrue()
  }

  @Test
  fun needsCodegenFromPackageJson_withMissingCodegenConfigInModel_returnsFalse() {
    val project = createProject()
    val model = ModelPackageJson("1000.0.0", null)

    assertThat(project.needsCodegenFromPackageJson(model)).isFalse()
  }

  @Test
  fun needsCodegenFromPackageJson_withMissingPackageJson_returnsFalse() {
    val project = createProject()
    val extension = TestReactExtension(project)

    assertThat(project.needsCodegenFromPackageJson(extension.root)).isFalse()
  }

  @Test
  fun getReactNativeArchitectures_withMissingProperty_returnsEmptyList() {
    val project = createProject()
    assertThat(project.getReactNativeArchitectures().isEmpty()).isTrue()
  }

  @Test
  fun getReactNativeArchitectures_withEmptyProperty_returnsEmptyList() {
    val project = createProject()
    project.extensions.extraProperties.set("reactNativeArchitectures", "")
    assertThat(project.getReactNativeArchitectures().isEmpty()).isTrue()
  }

  @Test
  fun getReactNativeArchitectures_withSingleArch_returnsSingleton() {
    val project = createProject()
    project.extensions.extraProperties.set("reactNativeArchitectures", "x86")

    val archs = project.getReactNativeArchitectures()
    assertThat(archs.size).isEqualTo(1)
    assertThat(archs[0]).isEqualTo("x86")
  }

  @Test
  fun getReactNativeArchitectures_withMultipleArch_returnsList() {
    val project = createProject()
    project.extensions.extraProperties.set(
        "reactNativeArchitectures", "armeabi-v7a,arm64-v8a,x86,x86_64")

    val archs = project.getReactNativeArchitectures()
    assertThat(archs.size).isEqualTo(4)
    assertThat(archs[0]).isEqualTo("armeabi-v7a")
    assertThat(archs[1]).isEqualTo("arm64-v8a")
    assertThat(archs[2]).isEqualTo("x86")
    assertThat(archs[3]).isEqualTo("x86_64")
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
    assertThat(project.shouldWarnIfNewArchFlagIsSetInPrealpha(extension)).isTrue()
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
    assertThat(project.shouldWarnIfNewArchFlagIsSetInPrealpha(extension)).isTrue()
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
    assertThat(project.shouldWarnIfNewArchFlagIsSetInPrealpha(extension)).isTrue()
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
    assertThat(project.shouldWarnIfNewArchFlagIsSetInPrealpha(extension)).isFalse()
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
    assertThat(project.shouldWarnIfNewArchFlagIsSetInPrealpha(extension)).isFalse()
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
    assertThat(project.shouldWarnIfNewArchFlagIsSetInPrealpha(extension)).isFalse()
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
    assertThat(project.shouldWarnIfNewArchFlagIsSetInPrealpha(extension)).isFalse()
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
    assertThat(project.shouldWarnIfNewArchFlagIsSetInPrealpha(extension)).isFalse()
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
    assertThat(project.shouldWarnIfNewArchFlagIsSetInPrealpha(extension)).isFalse()
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
    assertThat(project.shouldWarnIfNewArchFlagIsSetInPrealpha(extension)).isFalse()
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
    assertThat(project.shouldWarnIfNewArchFlagIsSetInPrealpha(extension)).isFalse()
  }
}
