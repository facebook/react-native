/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.react.ReactSettingsExtension.Companion.checkAndUpdateLockfiles
import com.facebook.react.ReactSettingsExtension.Companion.computeSha256
import com.facebook.react.ReactSettingsExtension.Companion.getLibrariesToAutolink
import groovy.test.GroovyTestCase.assertEquals
import java.io.File
import org.gradle.testfixtures.ProjectBuilder
import org.intellij.lang.annotations.Language
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class ReactSettingsExtensionTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun computeSha256_worksCorrectly() {
    val validFile =
        createJsonFile(
            """
      {
        "value": "¯\\_(ツ)_/¯"
      }
      """
                .trimIndent())

    assertEquals(
        "838aa9a72a16fdd55b0d49b510a82e264a30f59333b5fdd97c7798a29146f6a8",
        computeSha256(validFile))
  }

  @Test
  fun getLibrariesToAutolink_withEmptyFile_returnsEmptyMap() {
    val validJsonFile =
        createJsonFile(
            """
      {
        "reactNativeVersion": "1000.0.0"
      }
      """
                .trimIndent())

    val map = getLibrariesToAutolink(validJsonFile)
    assertEquals(0, map.keys.size)
  }

  @Test
  fun getLibrariesToAutolink_withLibraryToAutolink_returnsValidMap() {
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

    val map = getLibrariesToAutolink(validJsonFile)
    assertEquals(1, map.keys.size)
    assertTrue(":react-native_oss-library-example" in map.keys)
    assertEquals(
        File("./node_modules/@react-native/oss-library-example/android"),
        map[":react-native_oss-library-example"])
  }

  @Test
  fun getLibrariesToAutolink_withiOSOnlyLibrary_returnsEmptyMap() {
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
              "ios": {
                "podspecPath": "./node_modules/@react-native/oss-library-example/OSSLibraryExample.podspec",
                "version": "0.0.1",
                "configurations": [],
                "scriptPhases": []
              }
            }
          }
        }
      }
      """
                .trimIndent())

    val map = getLibrariesToAutolink(validJsonFile)
    assertEquals(0, map.keys.size)
  }

  @Test
  fun checkAndUpdateLockfiles_withNothingToCheck_returnsFalse() {
    val project = ProjectBuilder.builder().build()
    val noFiles = project.files()
    assertFalse(checkAndUpdateLockfiles(noFiles, tempFolder.root))
  }

  @Test
  fun checkAndUpdateLockfiles_withOneLockfileNoHash_returnsTrue() {
    val project = ProjectBuilder.builder().withProjectDir(tempFolder.root).build()
    val buildFolder = tempFolder.newFolder("build")
    tempFolder.newFile("yarn.lock").apply { writeText("I'm a lockfile") }
    val lockfileCollection = project.files("yarn.lock")

    assertTrue(checkAndUpdateLockfiles(lockfileCollection, buildFolder))
    assertTrue(File(buildFolder, "yarn.lock.sha").exists())
    assertEquals(
        "76046b72442ee7eb130627e56c3db7c9907eef4913b17ad130335edc0eb702a8",
        File(buildFolder, "yarn.lock.sha").readText())
  }

  @Test
  fun checkAndUpdateLockfiles_withOneLockfileInvalidHash_returnsTrue() {
    val project = ProjectBuilder.builder().withProjectDir(tempFolder.root).build()
    val buildFolder =
        tempFolder.newFolder("build").apply {
          File(this, "yarn.lock.sha").writeText("Just a stale hash")
        }
    tempFolder.newFile("yarn.lock").apply { writeText("I'm a lockfile") }
    val lockfileCollection = project.files("yarn.lock")

    assertTrue(checkAndUpdateLockfiles(lockfileCollection, buildFolder))
    assertTrue(File(buildFolder, "yarn.lock.sha").exists())
    assertEquals(
        "76046b72442ee7eb130627e56c3db7c9907eef4913b17ad130335edc0eb702a8",
        File(buildFolder, "yarn.lock.sha").readText())
  }

  @Test
  fun checkAndUpdateLockfiles_withOneLockfileValidHash_returnsFalse() {
    val project = ProjectBuilder.builder().withProjectDir(tempFolder.root).build()
    val buildFolder =
        tempFolder.newFolder("build").apply {
          File(this, "yarn.lock.sha")
              .writeText("76046b72442ee7eb130627e56c3db7c9907eef4913b17ad130335edc0eb702a8")
        }
    tempFolder.newFile("yarn.lock").apply { writeText("I'm a lockfile") }
    val lockfileCollection = project.files("yarn.lock")

    assertFalse(checkAndUpdateLockfiles(lockfileCollection, buildFolder))
    assertTrue(File(buildFolder, "yarn.lock.sha").exists())
    assertEquals(
        "76046b72442ee7eb130627e56c3db7c9907eef4913b17ad130335edc0eb702a8",
        File(buildFolder, "yarn.lock.sha").readText())
  }

  @Test
  fun checkAndUpdateLockfiles_withMultipleLockfilesInvalidHash_returnsTrue() {
    val project = ProjectBuilder.builder().withProjectDir(tempFolder.root).build()
    val buildFolder =
        tempFolder.newFolder("build").apply {
          File(this, "yarn.lock.sha").writeText("I'm an invalid hash")
        }
    tempFolder.newFile("yarn.lock").apply { writeText("I'm a lockfile") }
    tempFolder.newFile("package-lock.json").apply { writeText("and I'm another lockfile") }
    val lockfileCollection = project.files("yarn.lock", "package-lock.json")

    assertTrue(checkAndUpdateLockfiles(lockfileCollection, buildFolder))
    assertTrue(File(buildFolder, "yarn.lock.sha").exists())
    assertTrue(File(buildFolder, "package-lock.json.sha").exists())
    assertEquals(
        "76046b72442ee7eb130627e56c3db7c9907eef4913b17ad130335edc0eb702a8",
        File(buildFolder, "yarn.lock.sha").readText())
    assertEquals(
        "9be5bca432b81becf4f54451aea021add68376330581eaa93ab9a0b3e4e29a3b",
        File(buildFolder, "package-lock.json.sha").readText())
  }

  @Test
  fun checkAndUpdateLockfiles_withMultipleLockfilesValidHash_returnsFalse() {
    val project = ProjectBuilder.builder().withProjectDir(tempFolder.root).build()
    val buildFolder =
        tempFolder.newFolder("build").apply {
          File(this, "yarn.lock.sha")
              .writeText("76046b72442ee7eb130627e56c3db7c9907eef4913b17ad130335edc0eb702a8")
          File(this, "package-lock.json.sha")
              .writeText("9be5bca432b81becf4f54451aea021add68376330581eaa93ab9a0b3e4e29a3b")
        }
    tempFolder.newFile("yarn.lock").apply { writeText("I'm a lockfile") }
    tempFolder.newFile("package-lock.json").apply { writeText("and I'm another lockfile") }
    val lockfileCollection = project.files("yarn.lock", "package-lock.json")

    assertFalse(checkAndUpdateLockfiles(lockfileCollection, buildFolder))
    assertTrue(File(buildFolder, "yarn.lock.sha").exists())
    assertTrue(File(buildFolder, "package-lock.json.sha").exists())
    assertEquals(
        "76046b72442ee7eb130627e56c3db7c9907eef4913b17ad130335edc0eb702a8",
        File(buildFolder, "yarn.lock.sha").readText())
    assertEquals(
        "9be5bca432b81becf4f54451aea021add68376330581eaa93ab9a0b3e4e29a3b",
        File(buildFolder, "package-lock.json.sha").readText())
  }

  private fun createJsonFile(@Language("JSON") input: String) =
      tempFolder.newFile().apply { writeText(input) }
}
