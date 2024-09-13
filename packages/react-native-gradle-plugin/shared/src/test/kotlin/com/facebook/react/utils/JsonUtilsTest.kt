/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import org.intellij.lang.annotations.Language
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class JsonUtilsTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun fromPackageJson_withInvalidJson_returnsNull() {
    val invalidJson = createJsonFile("""¯\_(ツ)_/¯""")

    assertNull(JsonUtils.fromPackageJson(invalidJson))
  }

  @Test
  fun fromPackageJson_withEmptyJson_returnsEmptyObject() {
    val invalidJson = createJsonFile("""{}""")

    val parsed = JsonUtils.fromPackageJson(invalidJson)

    assertNotNull(parsed)
    assertNull(parsed?.codegenConfig)
  }

  @Test
  fun fromPackageJson_withOldJsonConfig_returnsAnEmptyLibrary() {
    val oldJsonConfig =
        createJsonFile(
            """
      {
        "name": "yet another npm package",
        "codegenConfig": {
          "libraries": [
            {
              "name": "an awesome library",
              "jsSrcsDir": "../js/",
              "android": {}
            }
          ]
        }
      }
      """
                .trimIndent())

    val parsed = JsonUtils.fromPackageJson(oldJsonConfig)!!

    assertNull(parsed.codegenConfig?.name)
    assertNull(parsed.codegenConfig?.jsSrcsDir)
    assertNull(parsed.codegenConfig?.android)
  }

  @Test
  fun fromPackageJson_withValidJson_parsesCorrectly() {
    val validJson =
        createJsonFile(
            """
      {
        "name": "yet another npm package",
        "codegenConfig": {
          "name": "an awesome library",
          "jsSrcsDir": "../js/",
          "android": {
            "javaPackageName": "com.awesome.library"
          },
          "ios": {
            "other ios only keys": "which are ignored during parsing"
          }
        }
      }
      """
                .trimIndent())

    val parsed = JsonUtils.fromPackageJson(validJson)!!

    assertEquals("an awesome library", parsed.codegenConfig!!.name)
    assertEquals("../js/", parsed.codegenConfig!!.jsSrcsDir)
    assertEquals("com.awesome.library", parsed.codegenConfig!!.android!!.javaPackageName)
  }

  @Test
  fun fromReactNativePackageJson_withInvalidJson_returnsNull() {
    val invalidJson = createJsonFile("""¯\_(ツ)_/¯""")

    assertNull(JsonUtils.fromPackageJson(invalidJson))
  }

  @Test
  fun fromReactNativePackageJson_withEmptyJson_returnsEmptyObject() {
    val invalidJson = createJsonFile("""{}""")

    val parsed = JsonUtils.fromPackageJson(invalidJson)

    assertNotNull(parsed)
    assertNull(parsed?.version)
  }

  @Test
  fun fromReactNativePackageJson_withValidJson_parsesJsonCorrectly() {
    val validJson =
        createJsonFile(
            """
      {
        "version": "1000.0.0"
      }
      """
                .trimIndent())
    val parsed = JsonUtils.fromPackageJson(validJson)!!

    assertEquals("1000.0.0", parsed.version)
  }

  @Test
  fun fromAutolinkingConfigJson_withInvalidJson_returnsNull() {
    val invalidJson = createJsonFile("""¯\_(ツ)_/¯""")

    assertNull(JsonUtils.fromAutolinkingConfigJson(invalidJson))
  }

  @Test
  fun fromAutolinkingConfigJson_withSimpleJson_returnsIt() {
    val validJson =
        createJsonFile(
            """
      {
        "reactNativeVersion": "1000.0.0"
      }
      """
                .trimIndent())
    val parsed = JsonUtils.fromAutolinkingConfigJson(validJson)!!

    assertEquals("1000.0.0", parsed.reactNativeVersion)
  }

  @Test
  fun fromAutolinkingConfigJson_withProjectSpecified_canParseIt() {
    val validJson =
        createJsonFile(
            """
      {
        "reactNativeVersion": "1000.0.0",
        "project": {
          "ios": {
            "sourceDir": "./packages/rn-tester",
            "xcodeProject": {
              "name": "RNTesterPods.xcworkspace",
              "isWorkspace": true
            },
            "automaticPodsInstallation": false
          },
          "android": {
            "sourceDir": "./packages/rn-tester",
            "appName": "RN-Tester",
            "packageName": "com.facebook.react.uiapp",
            "applicationId": "com.facebook.react.uiapp",
            "mainActivity": ".RNTesterActivity",
            "watchModeCommandParams": [
              "--mode HermesDebug"
            ],
            "dependencyConfiguration": "implementation"
          }
        }
      }
      """
                .trimIndent())
    val parsed = JsonUtils.fromAutolinkingConfigJson(validJson)!!

    assertEquals("./packages/rn-tester", parsed.project!!.android!!.sourceDir)
    assertEquals("RN-Tester", parsed.project!!.android!!.appName)
    assertEquals("com.facebook.react.uiapp", parsed.project!!.android!!.packageName)
    assertEquals("com.facebook.react.uiapp", parsed.project!!.android!!.applicationId)
    assertEquals(".RNTesterActivity", parsed.project!!.android!!.mainActivity)
    assertEquals("--mode HermesDebug", parsed.project!!.android!!.watchModeCommandParams!![0])
    assertEquals("implementation", parsed.project!!.android!!.dependencyConfiguration)
  }

  @Test
  fun fromAutolinkingConfigJson_withInfoLogs_sanitizeAndParseIt() {
    @Suppress("JsonStandardCompliance")
    val validJson =
        createJsonFile(
            """
      
      > AwesomeProject@0.0.1 npx
      > rnc-cli config
      
       {
        "reactNativeVersion": "1000.0.0",
        "project": {
          "ios": {
            "sourceDir": "./packages/rn-tester",
            "xcodeProject": {
              "name": "RNTesterPods.xcworkspace",
              "isWorkspace": true
            },
            "automaticPodsInstallation": false
          },
          "android": {
            "sourceDir": "./packages/rn-tester",
            "appName": "RN-Tester",
            "packageName": "com.facebook.react.uiapp",
            "applicationId": "com.facebook.react.uiapp",
            "mainActivity": ".RNTesterActivity",
            "watchModeCommandParams": [
              "--mode HermesDebug"
            ],
            "dependencyConfiguration": "implementation"
          }
        }
      } 
      """
                .trimIndent())
    val parsed = JsonUtils.fromAutolinkingConfigJson(validJson)!!

    assertThat("./packages/rn-tester").isEqualTo(parsed.project!!.android!!.sourceDir)
    assertThat("RN-Tester").isEqualTo(parsed.project!!.android!!.appName)
    assertThat("com.facebook.react.uiapp").isEqualTo(parsed.project!!.android!!.packageName)
    assertThat("com.facebook.react.uiapp").isEqualTo(parsed.project!!.android!!.applicationId)
    assertThat(".RNTesterActivity").isEqualTo(parsed.project!!.android!!.mainActivity)
    assertThat("--mode HermesDebug")
        .isEqualTo(parsed.project!!.android!!.watchModeCommandParams!![0])
    assertThat("implementation").isEqualTo(parsed.project!!.android!!.dependencyConfiguration)
  }

  @Test
  fun fromAutolinkingConfigJson_withDependenciesSpecified_canParseIt() {
    val validJson =
        createJsonFile(
            """
      {
        "reactNativeVersion": "1000.0.0",
        "dependencies": {
          "@react-native/oss-library-example": {
            "root": "./node_modules/@react-native/oss-library-example",
            "name": "@react-native/oss-library-example",
            "platforms": {
              "ios": {
                "podspecPath": "./node_modules/@react-native/oss-library-example/OSSLibraryExample.podspec",
                "version": "0.0.1",
                "configurations": [],
                "scriptPhases": []
              },
              "android": {
                "sourceDir": "./node_modules/@react-native/oss-library-example/android",
                "packageImportPath": "import com.facebook.react.osslibraryexample.OSSLibraryExamplePackage;",
                "packageInstance": "new OSSLibraryExamplePackage()",
                "buildTypes": ["staging", "debug", "release"],
                "libraryName": "OSSLibraryExampleSpec",
                "componentDescriptors": [
                  "SampleNativeComponentComponentDescriptor"
                ],
                "cmakeListsPath": "./node_modules/@react-native/oss-library-example/android/build/generated/source/codegen/jni/CMakeLists.txt",
                "cxxModuleCMakeListsModuleName": null,
                "cxxModuleCMakeListsPath": null,
                "cxxModuleHeaderName": null,
                "dependencyConfiguration": "implementation",
                "isPureCxxDependency": false
              }
            }
          }
        }
      }
      """
                .trimIndent())
    val parsed = JsonUtils.fromAutolinkingConfigJson(validJson)!!

    assertEquals(
        "./node_modules/@react-native/oss-library-example",
        parsed.dependencies!!["@react-native/oss-library-example"]!!.root)
    assertEquals(
        "@react-native/oss-library-example",
        parsed.dependencies!!["@react-native/oss-library-example"]!!.name)
    assertEquals(
        "react-native_oss-library-example",
        parsed.dependencies!!["@react-native/oss-library-example"]!!.nameCleansed)
    assertEquals(
        "./node_modules/@react-native/oss-library-example/android",
        parsed.dependencies!!["@react-native/oss-library-example"]!!
            .platforms!!
            .android!!
            .sourceDir)
    assertEquals(
        "import com.facebook.react.osslibraryexample.OSSLibraryExamplePackage;",
        parsed.dependencies!!["@react-native/oss-library-example"]!!
            .platforms!!
            .android!!
            .packageImportPath)
    assertEquals(
        "new OSSLibraryExamplePackage()",
        parsed.dependencies!!["@react-native/oss-library-example"]!!
            .platforms!!
            .android!!
            .packageInstance)
    assertEquals(
        listOf("staging", "debug", "release"),
        parsed.dependencies!!["@react-native/oss-library-example"]!!
            .platforms!!
            .android!!
            .buildTypes)
    assertEquals(
        "OSSLibraryExampleSpec",
        parsed.dependencies!!["@react-native/oss-library-example"]!!
            .platforms!!
            .android!!
            .libraryName)
    assertEquals(
        listOf("SampleNativeComponentComponentDescriptor"),
        parsed.dependencies!!["@react-native/oss-library-example"]!!
            .platforms!!
            .android!!
            .componentDescriptors)
    assertEquals(
        "./node_modules/@react-native/oss-library-example/android/build/generated/source/codegen/jni/CMakeLists.txt",
        parsed.dependencies!!["@react-native/oss-library-example"]!!
            .platforms!!
            .android!!
            .cmakeListsPath)
    assertNull(
        parsed.dependencies!!["@react-native/oss-library-example"]!!
            .platforms!!
            .android!!
            .cxxModuleHeaderName)
    assertNull(
        parsed.dependencies!!["@react-native/oss-library-example"]!!
            .platforms!!
            .android!!
            .cxxModuleCMakeListsPath)
    assertNull(
        parsed.dependencies!!["@react-native/oss-library-example"]!!
            .platforms!!
            .android!!
            .cxxModuleCMakeListsModuleName)
    assertEquals(
        "implementation",
        parsed.dependencies!!["@react-native/oss-library-example"]!!
            .platforms!!
            .android!!
            .dependencyConfiguration)
    assertFalse(
        parsed.dependencies!!["@react-native/oss-library-example"]!!
            .platforms!!
            .android!!
            .isPureCxxDependency!!)
  }

  private fun createJsonFile(@Language("JSON") input: String) =
      tempFolder.newFile().apply { writeText(input) }
}
