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
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class BundleHermesCTaskTest {

  @get:Rule val tempFolder = TemporaryFolder()

  @get:Rule val osRule = OsRule()

  @Test
  fun bundleTask_groupIsSetCorrectly() {
    val task = createTestTask<BundleHermesCTask> {}
    assertEquals("react", task.group)
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

    assertEquals(4, task.sources.files.size)
    assertEquals(
        setOf(
            File(rootDir, "file.js"),
            File(rootDir, "file.jsx"),
            File(rootDir, "file.ts"),
            File(rootDir, "file.tsx")),
        task.sources.files)
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

    assertEquals(
        setOf(
            "**/android/**/*",
            "**/ios/**/*",
            "**/build/**/*",
            "**/node_modules/**/*",
        ),
        task.sources.excludes)
    assertEquals(1, task.sources.files.size)
    assertEquals(setOf(File(rootDir, "afolder/includedfile.js")), task.sources.files)
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

    assertEquals(listOf("node", "arg1", "arg2"), task.nodeExecutableAndArgs.get())
    assertEquals("bundle", task.bundleCommand.get())
    assertEquals("myassetname", task.bundleAssetName.get())
    assertTrue(task.minifyEnabled.get())
    assertTrue(task.hermesEnabled.get())
    assertTrue(task.devEnabled.get())
    assertEquals(listOf("extra", "arg"), task.extraPackagerArgs.get())
    assertEquals("./my-hermesc", task.hermesCommand.get())
    assertEquals(listOf("flag1", "flag2"), task.hermesFlags.get())
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

    assertEquals(entryFile, task.entryFile.get().asFile)
    assertEquals(cliFile, task.cliFile.get().asFile)
    assertEquals(jsBundleDir, task.jsBundleDir.get().asFile)
    assertEquals(resourcesDir, task.resourcesDir.get().asFile)
    assertEquals(jsIntermediateSourceMapsDir, task.jsIntermediateSourceMapsDir.get().asFile)
    assertEquals(jsSourceMapsDir, task.jsSourceMapsDir.get().asFile)
    assertEquals(bundleConfig, task.bundleConfig.get().asFile)
    assertEquals(reactNativeDir, task.reactNativeDir.get().asFile)
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

    assertEquals(
        File(jsIntermediateSourceMapsDir, "myassetname.packager.map"),
        task.resolvePackagerSourceMapFile(bundleAssetName))
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

    assertEquals(
        File(jsSourceMapsDir, "myassetname.map"),
        task.resolvePackagerSourceMapFile(bundleAssetName))
  }

  @Test
  fun resolveOutputSourceMap_returnsCorrectFile() {
    val jsSourceMapsDir = tempFolder.newFolder("jsSourceMaps")
    val bundleAssetName = "myassetname"
    val task = createTestTask<BundleHermesCTask> { it.jsSourceMapsDir.set(jsSourceMapsDir) }

    assertEquals(
        File(jsSourceMapsDir, "myassetname.map"), task.resolveOutputSourceMap(bundleAssetName))
  }

  @Test
  fun resolveCompilerSourceMap_returnsCorrectFile() {
    val jsIntermediateSourceMapsDir = tempFolder.newFolder("jsIntermediateSourceMaps")
    val bundleAssetName = "myassetname"
    val task =
        createTestTask<BundleHermesCTask> {
          it.jsIntermediateSourceMapsDir.set(jsIntermediateSourceMapsDir)
        }

    assertEquals(
        File(jsIntermediateSourceMapsDir, "myassetname.compiler.map"),
        task.resolveCompilerSourceMap(bundleAssetName))
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

    assertEquals("node", bundleCommand[0])
    assertEquals("arg1", bundleCommand[1])
    assertEquals("arg2", bundleCommand[2])
    assertEquals(cliFile.absolutePath, bundleCommand[3])
    assertEquals("bundle", bundleCommand[4])
    assertEquals("--platform", bundleCommand[5])
    assertEquals("android", bundleCommand[6])
    assertEquals("--dev", bundleCommand[7])
    assertEquals("true", bundleCommand[8])
    assertEquals("--reset-cache", bundleCommand[9])
    assertEquals("--entry-file", bundleCommand[10])
    assertEquals(entryFile.absolutePath, bundleCommand[11])
    assertEquals("--bundle-output", bundleCommand[12])
    assertEquals(bundleFile.absolutePath, bundleCommand[13])
    assertEquals("--assets-dest", bundleCommand[14])
    assertEquals(resourcesDir.absolutePath, bundleCommand[15])
    assertEquals("--sourcemap-output", bundleCommand[16])
    assertEquals(sourceMapFile.absolutePath, bundleCommand[17])
    assertEquals("--config", bundleCommand[18])
    assertEquals(bundleConfig.absolutePath, bundleCommand[19])
    assertEquals("--minify", bundleCommand[20])
    assertEquals("true", bundleCommand[21])
    assertEquals("--read-global-cache", bundleCommand[22])
    assertEquals("--verbose", bundleCommand[23])
    assertEquals(24, bundleCommand.size)
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

    assertEquals("cmd", bundleCommand[0])
    assertEquals("/c", bundleCommand[1])
    assertEquals("node", bundleCommand[2])
    assertEquals("arg1", bundleCommand[3])
    assertEquals("arg2", bundleCommand[4])
    assertEquals(cliFile.relativeTo(tempFolder.root).path, bundleCommand[5])
    assertEquals("bundle", bundleCommand[6])
    assertEquals("--platform", bundleCommand[7])
    assertEquals("android", bundleCommand[8])
    assertEquals("--dev", bundleCommand[9])
    assertEquals("true", bundleCommand[10])
    assertEquals("--reset-cache", bundleCommand[11])
    assertEquals("--entry-file", bundleCommand[12])
    assertEquals(entryFile.relativeTo(tempFolder.root).path, bundleCommand[13])
    assertEquals("--bundle-output", bundleCommand[14])
    assertEquals(bundleFile.relativeTo(tempFolder.root).path, bundleCommand[15])
    assertEquals("--assets-dest", bundleCommand[16])
    assertEquals(resourcesDir.relativeTo(tempFolder.root).path, bundleCommand[17])
    assertEquals("--sourcemap-output", bundleCommand[18])
    assertEquals(sourceMapFile.relativeTo(tempFolder.root).path, bundleCommand[19])
    assertEquals("--config", bundleCommand[20])
    assertEquals(bundleConfig.relativeTo(tempFolder.root).path, bundleCommand[21])
    assertEquals("--minify", bundleCommand[22])
    assertEquals("true", bundleCommand[23])
    assertEquals("--read-global-cache", bundleCommand[24])
    assertEquals("--verbose", bundleCommand[25])
    assertEquals(26, bundleCommand.size)
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

    assertTrue("--config" !in bundleCommand)
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

    assertEquals(customHermesc, hermesCommand[0])
    assertEquals("-emit-binary", hermesCommand[1])
    assertEquals("-out", hermesCommand[2])
    assertEquals(bytecodeFile.absolutePath, hermesCommand[3])
    assertEquals(bundleFile.absolutePath, hermesCommand[4])
    assertEquals("my-custom-hermes-flag", hermesCommand[5])
    assertEquals(6, hermesCommand.size)
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

    assertEquals("cmd", hermesCommand[0])
    assertEquals("/c", hermesCommand[1])
    assertEquals(customHermesc, hermesCommand[2])
    assertEquals("-emit-binary", hermesCommand[3])
    assertEquals("-out", hermesCommand[4])
    assertEquals(bytecodeFile.relativeTo(tempFolder.root).path, hermesCommand[5])
    assertEquals(bundleFile.relativeTo(tempFolder.root).path, hermesCommand[6])
    assertEquals("my-custom-hermes-flag", hermesCommand[7])
    assertEquals(8, hermesCommand.size)
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

    assertEquals("node", composeSourcemapCommand[0])
    assertEquals("arg1", composeSourcemapCommand[1])
    assertEquals("arg2", composeSourcemapCommand[2])
    assertEquals(composeSourceMapsFile.absolutePath, composeSourcemapCommand[3])
    assertEquals(packagerMap.absolutePath, composeSourcemapCommand[4])
    assertEquals(compilerMap.absolutePath, composeSourcemapCommand[5])
    assertEquals("-o", composeSourcemapCommand[6])
    assertEquals(outputMap.absolutePath, composeSourcemapCommand[7])
    assertEquals(8, composeSourcemapCommand.size)
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

    assertEquals("cmd", composeSourcemapCommand[0])
    assertEquals("/c", composeSourcemapCommand[1])
    assertEquals("node", composeSourcemapCommand[2])
    assertEquals("arg1", composeSourcemapCommand[3])
    assertEquals("arg2", composeSourcemapCommand[4])
    assertEquals(composeSourceMapsFile.relativeTo(tempFolder.root).path, composeSourcemapCommand[5])
    assertEquals(packagerMap.relativeTo(tempFolder.root).path, composeSourcemapCommand[6])
    assertEquals(compilerMap.relativeTo(tempFolder.root).path, composeSourcemapCommand[7])
    assertEquals("-o", composeSourcemapCommand[8])
    assertEquals(outputMap.relativeTo(tempFolder.root).path, composeSourcemapCommand[9])
    assertEquals(10, composeSourcemapCommand.size)
  }
}
