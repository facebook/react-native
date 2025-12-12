/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks.internal

import com.facebook.react.tasks.internal.utils.PrefabPreprocessingEntry
import java.io.File
import javax.inject.Inject
import org.gradle.api.DefaultTask
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.file.FileSystemOperations
import org.gradle.api.file.RegularFile
import org.gradle.api.provider.ListProperty
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.OutputDirectory
import org.gradle.api.tasks.TaskAction

/**
 * A task that takes care of copying headers and filtering them so that can be consumed by the
 * Prefab protocol. This task handles also the header prefixes.
 *
 * It currently filters out some of the Boost headers as they're not used by React Native and are
 * resulting in bigger .aar (250Mb+).
 *
 * You should provide in input a list fo [PrefabPreprocessingEntry] that will be used by this task
 * to do the necessary copy operations.
 */
abstract class PreparePrefabHeadersTask : DefaultTask() {

  @get:Input abstract val input: ListProperty<PrefabPreprocessingEntry>

  @get:OutputDirectory abstract val outputDir: DirectoryProperty

  @get:Inject abstract val fs: FileSystemOperations

  @TaskAction
  fun taskAction() {
    input.get().forEach { (libraryName, pathToPrefixCouples) ->
      val outputFolder: RegularFile = outputDir.file(libraryName).get()
      pathToPrefixCouples.forEach { (headerPath, headerPrefix) ->
        fs.copy { copySpec ->
          copySpec.from(headerPath)
          copySpec.include("**/*.h")
          copySpec.exclude("**/*.cpp")
          copySpec.exclude("**/*.txt")
          // We don't want to copy all the boost headers as they are 250Mb+
          copySpec.include("boost/config.hpp")
          copySpec.include("boost/config/**/*.hpp")
          copySpec.include("boost/core/*.hpp")
          copySpec.include("boost/detail/workaround.hpp")
          copySpec.include("boost/operators.hpp")
          copySpec.include("boost/preprocessor/**/*.hpp")
          // Headers needed for exposing rrc_text and rrc_textinput
          copySpec.include("boost/container_hash/**/*.hpp")
          copySpec.include("boost/detail/**/*.hpp")
          copySpec.include("boost/intrusive/**/*.hpp")
          copySpec.include("boost/iterator/**/*.hpp")
          copySpec.include("boost/move/**/*.hpp")
          copySpec.include("boost/mpl/**/*.hpp")
          copySpec.include("boost/mp11/**/*.hpp")
          copySpec.include("boost/describe/**/*.hpp")
          copySpec.include("boost/type_traits/**/*.hpp")
          copySpec.include("boost/utility/**/*.hpp")
          copySpec.include("boost/assert.hpp")
          copySpec.include("boost/static_assert.hpp")
          copySpec.include("boost/cstdint.hpp")
          copySpec.include("boost/utility.hpp")
          copySpec.include("boost/version.hpp")
          copySpec.into(File(outputFolder.asFile, headerPrefix))
        }
      }
    }
  }
}
