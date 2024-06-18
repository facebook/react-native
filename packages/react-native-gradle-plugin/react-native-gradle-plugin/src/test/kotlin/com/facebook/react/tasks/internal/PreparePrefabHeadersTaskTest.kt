/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks.internal

import com.facebook.react.tasks.internal.utils.PrefabPreprocessingEntry
import com.facebook.react.tests.createProject
import com.facebook.react.tests.createTestTask
import java.io.*
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class PreparePrefabHeadersTaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  fun preparePrefabHeadersTask_withMissingConfiguration_doesNothing() {
    val task = createTestTask<PreparePrefabHeadersTask>()

    task.taskAction()
  }

  @Test
  fun preparePrefabHeadersTask_withSingleEntry_copiesHeaderFile() {
    val outputDir = tempFolder.newFolder("output")
    File(tempFolder.root, "input/hello.h").createNewPathAndFile()

    val project = createProject(projectDir = tempFolder.root)
    val task =
        createTestTask<PreparePrefabHeadersTask>(project = project) {
          it.outputDir.set(outputDir)
          it.input.set(listOf(PrefabPreprocessingEntry("sample_library", "input/" to "")))
        }

    task.taskAction()

    assertTrue(File(outputDir, "sample_library/hello.h").exists())
  }

  @Test
  fun preparePrefabHeadersTask_withSingleEntry_respectsPrefix() {
    val expectedPrefix = "react/render/something/"
    val outputDir = tempFolder.newFolder("output")
    File(tempFolder.root, "input/hello.h").createNewPathAndFile()

    val project = createProject(projectDir = tempFolder.root)
    val task =
        createTestTask<PreparePrefabHeadersTask>(project = project) {
          it.outputDir.set(outputDir)
          it.input.set(
              listOf(PrefabPreprocessingEntry("sample_library", "input/" to expectedPrefix)))
        }

    task.taskAction()

    assertTrue(File(outputDir, "sample_library/${expectedPrefix}hello.h").exists())
  }

  @Test
  fun preparePrefabHeadersTask_ignoresUnnecessaryFiles() {
    val expectedPrefix = "react/render/something/"
    val outputDir = tempFolder.newFolder("output")
    File(tempFolder.root, "input/hello.hpp").createNewPathAndFile()
    File(tempFolder.root, "input/hello.cpp").createNewPathAndFile()
    File(tempFolder.root, "input/CMakeLists.txt").createNewPathAndFile()

    val project = createProject(projectDir = tempFolder.root)
    val task =
        createTestTask<PreparePrefabHeadersTask>(project = project) {
          it.outputDir.set(outputDir)
          it.input.set(
              listOf(PrefabPreprocessingEntry("sample_library", "input/" to expectedPrefix)))
        }

    task.taskAction()

    assertFalse(File(outputDir, "sample_library/hello.hpp").exists())
    assertFalse(File(outputDir, "sample_library/hello.cpp").exists())
    assertFalse(File(outputDir, "sample_library/CMakeLists.txt").exists())
  }

  @Test
  fun preparePrefabHeadersTask_withMultiplePaths_copiesHeaderFiles() {
    val outputDir = tempFolder.newFolder("output")
    File(tempFolder.root, "input/component1/hello1.h").createNewPathAndFile()
    File(tempFolder.root, "input/component2/debug/hello2.h").createNewPathAndFile()

    val project = createProject(projectDir = tempFolder.root)
    val task =
        createTestTask<PreparePrefabHeadersTask>(project = project) {
          it.outputDir.set(outputDir)
          it.input.set(
              listOf(
                  PrefabPreprocessingEntry(
                      "sample_library",
                      listOf("input/component1/" to "", "input/component2/" to "")),
              ))
        }

    task.taskAction()

    assertTrue(File(outputDir, "sample_library/hello1.h").exists())
    assertTrue(File(outputDir, "sample_library/debug/hello2.h").exists())
  }

  @Test
  fun preparePrefabHeadersTask_withMultipleEntries_copiesHeaderFiles() {
    val outputDir = tempFolder.newFolder("output")
    File(tempFolder.root, "input/lib1/hello1.h").createNewPathAndFile()
    File(tempFolder.root, "input/lib2/hello2.h").createNewPathAndFile()

    val project = createProject(projectDir = tempFolder.root)
    val task =
        createTestTask<PreparePrefabHeadersTask>(project = project) {
          it.outputDir.set(outputDir)
          it.input.set(
              listOf(
                  PrefabPreprocessingEntry("libraryone", "input/lib1/" to ""),
                  PrefabPreprocessingEntry("librarytwo", "input/lib2/" to "")))
        }

    task.taskAction()

    assertTrue(File(outputDir, "libraryone/hello1.h").exists())
    assertTrue(File(outputDir, "librarytwo/hello2.h").exists())
  }

  @Test
  fun preparePrefabHeadersTask_withReusedHeaders_copiesHeadersTwice() {
    val outputDir = tempFolder.newFolder("output")
    File(tempFolder.root, "input/lib1/hello1.h").createNewPathAndFile()
    File(tempFolder.root, "input/lib2/hello2.h").createNewPathAndFile()
    File(tempFolder.root, "input/shared/sharedheader.h").createNewPathAndFile()

    val project = createProject(projectDir = tempFolder.root)
    val task =
        createTestTask<PreparePrefabHeadersTask>(project = project) {
          it.outputDir.set(outputDir)
          it.input.set(
              listOf(
                  PrefabPreprocessingEntry(
                      "libraryone", listOf("input/lib1/" to "", "input/shared/" to "shared/")),
                  PrefabPreprocessingEntry(
                      "librarytwo", listOf("input/lib2/" to "", "input/shared/" to "shared/")),
              ))
        }

    task.taskAction()

    assertTrue(File(outputDir, "libraryone/hello1.h").exists())
    assertTrue(File(outputDir, "libraryone/shared/sharedheader.h").exists())
    assertTrue(File(outputDir, "librarytwo/hello2.h").exists())
    assertTrue(File(outputDir, "librarytwo/shared/sharedheader.h").exists())
  }

  @Test
  fun preparePrefabHeadersTask_withBoostHeaders_filtersThemCorrectly() {
    val outputDir = tempFolder.newFolder("output")
    File(tempFolder.root, "boost/boost/config.hpp").createNewPathAndFile()
    File(tempFolder.root, "boost/boost/operators.hpp").createNewPathAndFile()
    File(tempFolder.root, "boost/boost/config/default/default.hpp").createNewPathAndFile()
    File(tempFolder.root, "boost/boost/core/core.hpp").createNewPathAndFile()
    File(tempFolder.root, "boost/boost/detail/workaround.hpp").createNewPathAndFile()
    File(tempFolder.root, "boost/boost/preprocessor/preprocessor.hpp").createNewPathAndFile()
    File(tempFolder.root, "boost/boost/preprocessor/detail/preprocessor_detail.hpp")
        .createNewPathAndFile()
    File(tempFolder.root, "boost/boost/anothermodule/wedontuse.hpp").createNewPathAndFile()

    val project = createProject(projectDir = tempFolder.root)
    val task =
        createTestTask<PreparePrefabHeadersTask>(project = project) {
          it.outputDir.set(outputDir)
          it.input.set(listOf(PrefabPreprocessingEntry("sample_library", "boost/" to "")))
        }

    task.taskAction()

    assertTrue(File(outputDir, "sample_library/boost/config.hpp").exists())
    assertTrue(File(outputDir, "sample_library/boost/operators.hpp").exists())
    assertTrue(File(outputDir, "sample_library/boost/config/default/default.hpp").exists())
    assertTrue(File(outputDir, "sample_library/boost/core/core.hpp").exists())
    assertTrue(File(outputDir, "sample_library/boost/detail/workaround.hpp").exists())
    assertTrue(File(outputDir, "sample_library/boost/preprocessor/preprocessor.hpp").exists())
    assertTrue(
        File(outputDir, "sample_library/boost/preprocessor/detail/preprocessor_detail.hpp")
            .exists())
    assertFalse(File(outputDir, "sample_library/boost/anothermodule/wedontuse.hpp").exists())
  }

  private fun File.createNewPathAndFile() {
    parentFile.mkdirs()
    createNewFile()
  }
}
