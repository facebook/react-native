/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import java.io.File
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class AgpConfiguratorUtilsTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun getPackageNameFromManifest_withEmptyFile_returnsNull() {
    val mainFolder = tempFolder.newFolder("awesome-module/src/main/")
    val manifest = File(mainFolder, "AndroidManifest.xml").apply { writeText("") }

    val actual = getPackageNameFromManifest(manifest)
    assertNull(actual)
  }

  @Test
  fun getPackageNameFromManifest_withMissingPackage_returnsNull() {
    val mainFolder = tempFolder.newFolder("awesome-module/src/main/")
    val manifest =
        File(mainFolder, "AndroidManifest.xml").apply {
          writeText(
              // language=xml
              """
          <manifest xmlns:android="http://schemas.android.com/apk/res/android">
          </manifest>
          """
                  .trimIndent())
        }

    val actual = getPackageNameFromManifest(manifest)
    assertNull(actual)
  }

  @Test
  fun getPackageNameFromManifest_withPackage_returnsPackage() {
    val mainFolder = tempFolder.newFolder("awesome-module/src/main/")
    val manifest =
        File(mainFolder, "AndroidManifest.xml").apply {
          writeText(
              // language=xml
              """
          <manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.facebook.react" >
          </manifest>
          """
                  .trimIndent())
        }

    val actual = getPackageNameFromManifest(manifest)
    assertNotNull(actual)
    assertEquals("com.facebook.react", actual)
  }
}
