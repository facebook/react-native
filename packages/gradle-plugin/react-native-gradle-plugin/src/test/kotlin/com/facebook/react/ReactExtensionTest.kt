/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.react.ReactExtension.Companion.getGradleDependenciesToApply
import org.intellij.lang.annotations.Language
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class ReactExtensionTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun getGradleDependenciesToApply_withEmptyFile_returnsEmptyMap() {
    val validJsonFile =
        createJsonFile(
            """
      {
        "reactNativeVersion": "1000.0.0"
      }
      """
                .trimIndent())

    val deps = getGradleDependenciesToApply(validJsonFile)
    assertEquals(0, deps.size)
  }

  @Test
  fun getGradleDependenciesToApply_withOneDependency_returnsValidDep() {
    val validJsonFile =
        createJsonFile(
            """
      {
        "reactNativeVersion": "1000.0.0",
        "dependencies": {
          "@react-native/oss-library-example": {
            "root": "./node_modules/@react-native/oss-library-example",
            "name": "@react-native/oss-library-example",
            "platforms": {
              "android": {
                "sourceDir": "src/main/java",
                "packageImportPath": "com.facebook.react"
              }
            }
          }
        }
      }
      """
                .trimIndent())

    val deps = getGradleDependenciesToApply(validJsonFile)
    assertEquals(1, deps.size)
    assertTrue("implementation" to ":react-native_oss-library-example" in deps)
  }

  @Test
  fun getGradleDependenciesToApply_withDependencyConfiguration_returnsValidConfiguration() {
    val validJsonFile =
        createJsonFile(
            """
      {
        "reactNativeVersion": "1000.0.0",
        "dependencies": {
          "@react-native/oss-library-example": {
            "root": "./node_modules/@react-native/oss-library-example",
            "name": "@react-native/oss-library-example",
            "platforms": {
              "android": {
                "sourceDir": "src/main/java",
                "packageImportPath": "com.facebook.react",
                "dependencyConfiguration": "compileOnly"
              }
            }
          }
        }
      }
      """
                .trimIndent())

    val deps = getGradleDependenciesToApply(validJsonFile)
    assertEquals(1, deps.size)
    assertTrue("compileOnly" to ":react-native_oss-library-example" in deps)
  }

  @Test
  fun getGradleDependenciesToApply_withBuildTypes_returnsValidConfiguration() {
    val validJsonFile =
        createJsonFile(
            """
      {
        "reactNativeVersion": "1000.0.0",
        "dependencies": {
          "@react-native/oss-library-example": {
            "root": "./node_modules/@react-native/oss-library-example",
            "name": "@react-native/oss-library-example",
            "platforms": {
              "android": {
                "sourceDir": "src/main/java",
                "packageImportPath": "com.facebook.react",
                "buildTypes": ["debug", "release"]
              }
            }
          }
        }
      }
      """
                .trimIndent())

    val deps = getGradleDependenciesToApply(validJsonFile)
    assertEquals(2, deps.size)
    assertTrue("debugImplementation" to ":react-native_oss-library-example" in deps)
    assertTrue("releaseImplementation" to ":react-native_oss-library-example" in deps)
  }

  @Test
  fun getGradleDependenciesToApply_withMultipleDependencies_returnsValidConfiguration() {
    val validJsonFile =
        createJsonFile(
            """
      {
        "reactNativeVersion": "1000.0.0",
        "dependencies": {
          "@react-native/oss-library-example": {
            "root": "./node_modules/@react-native/oss-library-example",
            "name": "@react-native/oss-library-example",
            "platforms": {
              "android": {
                "sourceDir": "src/main/java",
                "packageImportPath": "com.facebook.react"
              }
            }
          },
          "@react-native/another-library-for-testing": {
            "root": "./node_modules/@react-native/another-library-for-testing",
            "name": "@react-native/another-library-for-testing",
            "platforms": {
              "android": {
                "sourceDir": "src/main/java",
                "packageImportPath": "com.facebook.react"
              }
            }
          }
        }
      }
      """
                .trimIndent())

    val deps = getGradleDependenciesToApply(validJsonFile)
    assertEquals(2, deps.size)
    assertTrue("implementation" to ":react-native_oss-library-example" in deps)
    assertTrue("implementation" to ":react-native_another-library-for-testing" in deps)
  }

  private fun createJsonFile(@Language("JSON") input: String) =
      tempFolder.newFile().apply { writeText(input) }
}
