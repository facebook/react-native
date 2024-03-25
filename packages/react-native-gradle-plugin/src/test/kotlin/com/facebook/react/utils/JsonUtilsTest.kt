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
  fun withInvalidJson_returnsNull() {
    val invalidJson = createJsonFile("""¯\_(ツ)_/¯""")

    assertNull(JsonUtils.fromPackageJson(invalidJson))
  }

  @Test
  fun withEmptyJson_returnsEmptyObject() {
    val invalidJson = createJsonFile("""{}""")

    val parsed = JsonUtils.fromPackageJson(invalidJson)

    assertNotNull(parsed)
    assertNull(parsed?.codegenConfig)
  }

  @Test
  fun withOldJsonConfig_returnsAnEmptyLibrary() {
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
  fun withValidJson_parsesCorrectly() {
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

  private fun createJsonFile(@Language("JSON") input: String) =
      tempFolder.newFile().apply { writeText(input) }
}
