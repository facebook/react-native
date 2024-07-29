/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tasks

import com.facebook.react.tests.OS
import com.facebook.react.tests.OsRule
import com.facebook.react.tests.WithOs
import com.facebook.react.tests.createTestTask
import java.io.File
import org.assertj.core.api.Assertions.assertThat
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class BundleHermesCTaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @get:Rule val osRule = OsRule()

  @Test
  fun bundleTask_groupIsSetCorrectly() {
    val task = createTestTask<BundleHermesCTask> {}
    assertThat(task.group).isEqualTo("react")
  }

  @Test
  fun bundleTask_inputFiles_areSetCorrectly() {
    val rootDir =
        tempFolder.newFolder("js").apply {
          File(this, "file.js").createNewFile()
          File(this, "file.jsx").createNewFile()
          File(this, "file.ts").createNewFile()
          File(this, "file.tsx").createNewFile()
        }

    val task = createTestTask<BundleHermesCTask> { it.root.set(rootDir) }

    assertThat(task.sources.files.size).isEqualTo(4)
    assertThat(task.sources.files).containsExactlyInAnyOrder(
        File(rootDir, "file.js"),
        File(rootDir, "file.jsx"),
        File(rootDir, "file.ts"),
        File(rootDir, "file.tsx"))
  }

  @Test
  fun bundleTask_inputFilesInExcludedPath_areExcluded() {
    fun File.createFileAndPath() {
      parentFile.mkdirs()
      createNewFile()
    }

    val rootDir =
        tempFolder.newFolder("js").apply {
          File(this, "afolder/includedfile.js").createFileAndPath()
          // Those files should be excluded due to their filepath
          File(this, "android/excludedfile.js").createFileAndPath()
          File(this, "ios/excludedfile.js").createFileAndPath()
          File(this, "build/excludedfile.js").createFileAndPath()
          File(this, "node_modules/react-native/excludedfile.js").createFileAndPath()
        }

    val task = createTestTask<BundleHermesCTask> { it.root.set(rootDir) }

    assertThat(task.sources.excludes).containsExactlyInAnyOrder(
        "**/android/**/*",
        "**/ios/**/*",
        "**/build/**/*",
        "**/node_modules/**/*"
    )
    assertThat(task.sources.files.size).isEqualTo(1)
    assertThat(task.sources.files).containsExactly(File(rootDir, "afolder/includedfile.js"))
  }

  @Test
  fun bundleTask_staticInputs_areSetCorrectly() {
    val task =
        createTestTask<BundleHermesCTask> {
          it.nodeExecutableAndArgs.set(listOf("node", "arg1", "arg2"))
          it.bundleCommand.set("bundle")
          it.bundleAssetName.set("myassetname")
          it.minifyEnabled.set(true)
          it.hermesEnabled.set(true)
          it.devEnabled.set(true)
          it.extraPackagerArgs.set(listOf("extra", "arg"))
          it.hermesCommand.set("./my-hermesc")
          it.hermesFlags.set(listOf("flag1", "flag2"))
        }

    assertThat(task.nodeExecutableAndArgs.get()).isEqualTo(listOf("node", "arg1", "arg2"))
    assertThat(task.bundleCommand.get()).isEqualTo("bundle")
    assertThat(task.bundleAssetName.get()).isEqualTo("myassetname")
    assertThat(task.minifyEnabled.get()).isTrue()
    assertThat(task.hermesEnabled.get()).isTrue()
    assertThat(task.devEnabled.get()).isTrue()
    assertThat(task.extraPackagerArgs.get()).isEqualTo(listOf("extra", "arg"))
    assertThat(task.hermesCommand.get()).isEqualTo("./my-hermesc")
    assertThat(task.hermesFlags.get()).isEqualTo(listOf("flag1", "flag2"))
  }

  @Test
  fun bundleTask_filesInput_areSetCorrectly() {
    val entryFile = tempFolder.newFile("entry.js")
    val cliFile = tempFolder.newFile("cli.js")
    val jsBundleDir = tempFolder.newFolder("jsbundle")
    val resourcesDir = tempFolder.newFolder("resources")
    val jsIntermediateSourceMapsDir = tempFolder.newFolder("jsIntermediateSourceMaps")
    val jsSourceMapsDir = tempFolder.newFolder("jsSourceMaps")
    val bundleConfig = tempFolder.newFile("bundle.config")
    val reactNativeDir = tempFolder.newFolder("node_modules/react-native")

    val task =
        createTestTask<BundleHermesCTask> {
          it.entryFile.set(entryFile)
          it.cliFile.set(cliFile)
          it.jsBundleDir.set(jsBundleDir)
          it.resourcesDir.set(resourcesDir)
          it.jsIntermediateSourceMapsDir.set(jsIntermediateSourceMapsDir)
          it.jsSourceMapsDir.set(jsSourceMapsDir)
          it.bundleConfig.set(bundleConfig)
          it.reactNativeDir.set(reactNativeDir)
        }

    assertThat(task.entryFile.get().asFile).isEqualTo(entryFile)
    assertThat(task.cliFile.get().asFile).isEqualTo(cliFile)
    assertThat(task.jsBundleDir.get().asFile).isEqualTo(jsBundleDir)
    assertThat(task.resourcesDir.get().asFile).isEqualTo(resourcesDir)
    assertThat(task.jsIntermediateSourceMapsDir.get().asFile).isEqualTo(jsIntermediateSourceMapsDir)
    assertThat(task.jsSourceMapsDir.get().asFile).isEqualTo(jsSourceMapsDir)
    assertThat(task.bundleConfig.get().asFile).isEqualTo(bundleConfig)
    assertThat(task.reactNativeDir.get().asFile).isEqualTo(reactNativeDir)
  }

  @Test
  fun resolvePackagerSourceMapFile_withHermesEnabled_returnsCorrectFile() {
    val jsIntermediateSourceMapsDir = tempFolder.newFolder("jsIntermediateSourceMaps")
    val bundleAssetName = "myassetname"
    val task =
        createTestTask<BundleHermesCTask> {
          it.jsIntermediateSourceMapsDir.set(jsIntermediateSourceMapsDir)
          it.hermesEnabled.set(true)
          it.bundleAssetName.set(bundleAssetName)
        }

    assertThat(task.resolvePackagerSourceMapFile(bundleAssetName))
        .isEqualTo(File(jsIntermediateSourceMapsDir, "myassetname.packager.map"))
  }

  @Test
  fun resolvePackagerSourceMapFile_withHermesDisabled_returnsCorrectFile() {
    val jsSourceMapsDir = tempFolder.newFolder("jsSourceMaps")
    val bundleAssetName = "myassetname"
    val task =
        createTestTask<BundleHermesCTask> {
          it.jsSourceMapsDir.set(jsSourceMapsDir)
          it.hermesEnabled.set(false)
        }

    assertThat(task.resolvePackagerSourceMapFile(bundleAssetName))
        .isEqualTo(File(jsSourceMapsDir, "myassetname.map"))
  }

  @Test
  fun resolveOutputSourceMap_returnsCorrectFile() {
    val jsSourceMapsDir = tempFolder.newFolder("jsSourceMaps")
    val bundleAssetName = "myassetname"
    val task = createTestTask<BundleHermesCTask> { it.jsSourceMapsDir.set(jsSourceMapsDir) }

    assertThat(task.resolveOutputSourceMap(bundleAssetName))
        .isEqualTo(File(jsSourceMapsDir, "myassetname.map"))
  }

  @Test
  fun resolveCompilerSourceMap_returnsCorrectFile() {
    val jsIntermediateSourceMapsDir = tempFolder.newFolder("jsIntermediateSourceMaps")
    val bundleAssetName = "myassetname"
    val task =
        createTestTask<BundleHermesCTask> {
          it.jsIntermediateSourceMapsDir.set(jsIntermediateSourceMapsDir)
        }

    assertThat(task.resolveCompilerSourceMap(bundleAssetName))
        .isEqualTo(File(jsIntermediateSourceMapsDir, "myassetname.compiler.map"))
  }

  @Test
  fun getBundleCommand_returnsCorrectCommand() {
    val entryFile = tempFolder.newFile("index.js")
    val cliFile = tempFolder.newFile("cli.js")
    val bundleFile = tempFolder.newFile("bundle.js")
    val sourceMapFile = tempFolder.newFile("bundle.js.map")
    val resourcesDir = tempFolder.newFolder("res")
    val bundleConfig = tempFolder.newFile("bundle.config")
    val task =
        createTestTask<BundleHermesCTask> {
          it.nodeExecutableAndArgs.set(listOf("node", "arg1", "arg2"))
          it.root.set(tempFolder.root)
          it.cliFile.set(cliFile)
          it.bundleCommand.set("bundle")
          it.devEnabled.set(true)
          it.entryFile.set(entryFile)
          it.resourcesDir.set(resourcesDir)
          it.bundleConfig.set(bundleConfig)
          it.minifyEnabled.set(true)
          it.extraPackagerArgs.set(listOf("--read-global-cache"))
        }

    val bundleCommand = task.getBundleCommand(bundleFile, sourceMapFile)

    assertThat(bundleCommand[0]).isEqualTo("node")
    assertThat(bundleCommand[1]).isEqualTo("arg1")
    assertThat(bundleCommand[2]).isEqualTo("arg2")
    assertThat(bundleCommand[3]).isEqualTo(cliFile.absolutePath)
    assertThat(bundleCommand[4]).isEqualTo("bundle")
    assertThat(bundleCommand[5]).isEqualTo("--platform")
    assertThat(bundleCommand[6]).isEqualTo("android")
    assertThat(bundleCommand[7]).isEqualTo("--dev")
    assertThat(bundleCommand[8]).isEqualTo("true")
    assertThat(bundleCommand[9]).isEqualTo("--reset-cache")
    assertThat(bundleCommand[10]).isEqualTo("--entry-file")
    assertThat(bundleCommand[11]).isEqualTo(entryFile.absolutePath)
    assertThat(bundleCommand[12]).isEqualTo("--bundle-output")
    assertThat(bundleCommand[13]).isEqualTo(bundleFile.absolutePath)
    assertThat(bundleCommand[14]).isEqualTo("--assets-dest")
    assertThat(bundleCommand[15]).isEqualTo(resourcesDir.absolutePath)
    assertThat(bundleCommand[16]).isEqualTo("--sourcemap-output")
    assertThat(bundleCommand[17]).isEqualTo(sourceMapFile.absolutePath)
    assertThat(bundleCommand[18]).isEqualTo("--config")
    assertThat(bundleCommand[19]).isEqualTo(bundleConfig.absolutePath)
    assertThat(bundleCommand[20]).isEqualTo("--minify")
    assertThat(bundleCommand[21]).isEqualTo("true")
    assertThat(bundleCommand[22]).isEqualTo("--read-global-cache")
    assertThat(bundleCommand[23]).isEqualTo("--verbose")
    assertThat(bundleCommand.size).isEqualTo(24)
  }

  @Test
  @WithOs(OS.WIN)
  fun getBundleCommand_onWindows_returnsWinValidCommandsPaths() {
    val entryFile = tempFolder.newFile("index.js")
    val cliFile = tempFolder.newFile("cli.js")
    val bundleFile = tempFolder.newFile("bundle.js")
    val sourceMapFile = tempFolder.newFile("bundle.js.map")
    val resourcesDir = tempFolder.newFolder("res")
    val bundleConfig = tempFolder.newFile("bundle.config")
    val task =
        createTestTask<BundleHermesCTask> {
          it.nodeExecutableAndArgs.set(listOf("node", "arg1", "arg2"))
          it.root.set(tempFolder.root)
          it.cliFile.set(cliFile)
          it.bundleCommand.set("bundle")
          it.devEnabled.set(true)
          it.entryFile.set(entryFile)
          it.resourcesDir.set(resourcesDir)
          it.bundleConfig.set(bundleConfig)
          it.minifyEnabled.set(true)
          it.extraPackagerArgs.set(listOf("--read-global-cache"))
        }

    val bundleCommand = task.getBundleCommand(bundleFile, sourceMapFile)

    assertThat(bundleCommand[0]).isEqualTo("cmd")
    assertThat(bundleCommand[1]).isEqualTo("/c")
    assertThat(bundleCommand[2]).isEqualTo("node")
    assertThat(bundleCommand[3]).isEqualTo("arg1")
    assertThat(bundleCommand[4]).isEqualTo("arg2")
    assertThat(bundleCommand[5]).isEqualTo(cliFile.relativeTo(tempFolder.root).path)
    assertThat(bundleCommand[6]).isEqualTo("bundle")
    assertThat(bundleCommand[7]).isEqualTo("--platform")
    assertThat(bundleCommand[8]).isEqualTo("android")
    assertThat(bundleCommand[9]).isEqualTo("--dev")
    assertThat(bundleCommand[10]).isEqualTo("true")
    assertThat(bundleCommand[11]).isEqualTo("--reset-cache")
    assertThat(bundleCommand[12]).isEqualTo("--entry-file")
    assertThat(bundleCommand[13]).isEqualTo(entryFile.relativeTo(tempFolder.root).path)
    assertThat(bundleCommand[14]).isEqualTo("--bundle-output")
    assertThat(bundleCommand[15]).isEqualTo(bundleFile.relativeTo(tempFolder.root).path)
    assertThat(bundleCommand[16]).isEqualTo("--assets-dest")
    assertThat(bundleCommand[17]).isEqualTo(resourcesDir.relativeTo(tempFolder.root).path)
    assertThat(bundleCommand[18]).isEqualTo("--sourcemap-output")
    assertThat(bundleCommand[19]).isEqualTo(sourceMapFile.relativeTo(tempFolder.root).path)
    assertThat(bundleCommand[20]).isEqualTo("--config")
    assertThat(bundleCommand[21]).isEqualTo(bundleConfig.relativeTo(tempFolder.root).path)
    assertThat(bundleCommand[22]).isEqualTo("--minify")
    assertThat(bundleCommand[23]).isEqualTo("true")
    assertThat(bundleCommand[24]).isEqualTo("--read-global-cache")
    assertThat(bundleCommand[25]).isEqualTo("--verbose")
    assertThat(bundleCommand.size).isEqualTo(26)
  }

  @Test
  fun getBundleCommand_withoutConfig_returnsCommandWithoutConfig() {
    val entryFile = tempFolder.newFile("index.js")
    val cliFile = tempFolder.newFile("cli.js")
    val bundleFile = tempFolder.newFile("bundle.js")
    val sourceMapFile = tempFolder.newFile("bundle.js.map")
    val resourcesDir = tempFolder.newFolder("res")
    val task =
        createTestTask<BundleHermesCTask> {
          it.nodeExecutableAndArgs.set(listOf("node", "arg1", "arg2"))
          it.root.set(tempFolder.root)
          it.cliFile.set(cliFile)
          it.bundleCommand.set("bundle")
          it.devEnabled.set(true)
          it.entryFile.set(entryFile)
          it.resourcesDir.set(resourcesDir)
          it.minifyEnabled.set(true)
          it.extraPackagerArgs.set(listOf("--read-global-cache"))
        }

    val bundleCommand = task.getBundleCommand(bundleFile, sourceMapFile)

    assertThat(bundleCommand).doesNotContain("--config")
  }

  @Test
  fun getHermescCommand_returnsCorrectCommand() {
    val customHermesc = "hermesc"
    val bytecodeFile = tempFolder.newFile("bundle.js.hbc")
    val bundleFile = tempFolder.newFile("bundle.js")
    val task =
        createTestTask<BundleHermesCTask> {
          it.root.set(tempFolder.root)
          it.hermesFlags.set(listOf("my-custom-hermes-flag"))
        }

    val hermesCommand = task.getHermescCommand(customHermesc, bytecodeFile, bundleFile)

    assertThat(hermesCommand[0]).isEqualTo(customHermesc)
    assertThat(hermesCommand[1]).isEqualTo("-emit-binary")
    assertThat(hermesCommand[2]).isEqualTo("-max-diagnostic-width=80")
    assertThat(hermesCommand[3]).isEqualTo("-out")
    assertThat(hermesCommand[4]).isEqualTo(bytecodeFile.absolutePath)
    assertThat(hermesCommand[5]).isEqualTo(bundleFile.absolutePath)
    assertThat(hermesCommand[6]).isEqualTo("my-custom-hermes-flag")
    assertThat(hermesCommand.size).isEqualTo(7)
  }

  @Test
  @WithOs(OS.WIN)
  fun getHermescCommand_onWindows_returnsRelativePaths() {
    val customHermesc = "hermesc"
    val bytecodeFile = tempFolder.newFile("bundle.js.hbc")
    val bundleFile = tempFolder.newFile("bundle.js")
    val task =
        createTestTask<BundleHermesCTask> {
          it.root.set(tempFolder.root)
          it.hermesFlags.set(listOf("my-custom-hermes-flag"))
        }

    val hermesCommand = task.getHermescCommand(customHermesc, bytecodeFile, bundleFile)

    assertThat(hermesCommand[0]).isEqualTo("cmd")
    assertThat(hermesCommand[1]).isEqualTo("/c")
    assertThat(hermesCommand[2]).isEqualTo(customHermesc)
    assertThat(hermesCommand[3]).isEqualTo("-emit-binary")
    assertThat(hermesCommand[4]).isEqualTo("-max-diagnostic-width=80")
    assertThat(hermesCommand[5]).isEqualTo("-out")
    assertThat(hermesCommand[6]).isEqualTo(bytecodeFile.relativeTo(tempFolder.root).path)
    assertThat(hermesCommand[7]).isEqualTo(bundleFile.relativeTo(tempFolder.root).path)
    assertThat(hermesCommand[8]).isEqualTo("my-custom-hermes-flag")
    assertThat(hermesCommand.size).isEqualTo(9)
  }

  @Test
  fun getComposeSourceMapsCommand_returnsCorrectCommand() {
    val packagerMap = tempFolder.newFile("bundle.js.packager.map")
    val compilerMap = tempFolder.newFile("bundle.js.compiler.map")
    val outputMap = tempFolder.newFile("bundle.js.map")
    val reactNativeDir = tempFolder.newFolder("node_modules/react-native")
    val composeSourceMapsFile = File(reactNativeDir, "scripts/compose-source-maps.js")
    val task =
        createTestTask<BundleHermesCTask> {
          it.root.set(tempFolder.root)
          it.nodeExecutableAndArgs.set(listOf("node", "arg1", "arg2"))
        }

    val composeSourcemapCommand =
        task.getComposeSourceMapsCommand(composeSourceMapsFile, packagerMap, compilerMap, outputMap)

    assertThat(composeSourcemapCommand[0]).isEqualTo("node")
    assertThat(composeSourcemapCommand[1]).isEqualTo("arg1")
    assertThat(composeSourcemapCommand[2]).isEqualTo("arg2")
    assertThat(composeSourcemapCommand[3]).isEqualTo(composeSourceMapsFile.absolutePath)
    assertThat(composeSourcemapCommand[4]).isEqualTo(packagerMap.absolutePath)
    assertThat(composeSourcemapCommand[5]).isEqualTo(compilerMap.absolutePath)
    assertThat(composeSourcemapCommand[6]).isEqualTo("-o")
    assertThat(composeSourcemapCommand[7]).isEqualTo(outputMap.absolutePath)
    assertThat(composeSourcemapCommand.size).isEqualTo(8)
  }

  @Test
  @WithOs(OS.WIN)
  fun getComposeSourceMapsCommand_onWindows_returnsRelativePaths() {
    val packagerMap = tempFolder.newFile("bundle.js.packager.map")
    val compilerMap = tempFolder.newFile("bundle.js.compiler.map")
    val outputMap = tempFolder.newFile("bundle.js.map")
    val reactNativeDir = tempFolder.newFolder("node_modules/react-native")
    val composeSourceMapsFile = File(reactNativeDir, "scripts/compose-source-maps.js")
    val task =
        createTestTask<BundleHermesCTask> {
          it.root.set(tempFolder.root)
          it.nodeExecutableAndArgs.set(listOf("node", "arg1", "arg2"))
        }

    val composeSourcemapCommand =
        task.getComposeSourceMapsCommand(composeSourceMapsFile, packagerMap, compilerMap, outputMap)

    assertThat(composeSourcemapCommand[0]).isEqualTo("cmd")
    assertThat(composeSourcemapCommand[1]).isEqualTo("/c")
    assertThat(composeSourcemapCommand[2]).isEqualTo("node")
    assertThat(composeSourcemapCommand[3]).isEqualTo("arg1")
    assertThat(composeSourcemapCommand[4]).isEqualTo("arg2")
    assertThat(composeSourcemapCommand[5]).isEqualTo(composeSourceMapsFile.relativeTo(tempFolder.root).path)
    assertThat(composeSourcemapCommand[6]).isEqualTo(packagerMap.relativeTo(tempFolder.root).path)
    assertThat(composeSourcemapCommand[7]).isEqualTo(compilerMap.relativeTo(tempFolder.root).path)
    assertThat(composeSourcemapCommand[8]).isEqualTo("-o")
    assertThat(composeSourcemapCommand[9]).isEqualTo(outputMap.relativeTo(tempFolder.root).path)
    assertThat(composeSourcemapCommand.size).isEqualTo(10)
  }
}
