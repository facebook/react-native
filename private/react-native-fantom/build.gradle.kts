/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import com.android.build.gradle.internal.tasks.factory.dependsOn
import com.facebook.react.tasks.internal.*
import com.facebook.react.tasks.internal.utils.*
import de.undercouch.gradle.tasks.download.Download

plugins {
  id("com.facebook.react")
  alias(libs.plugins.download)
}

val FOLLY_VERSION = libs.versions.folly.get()
val GFLAGS_VERSION = libs.versions.gflags.get()
val NLOHMANNJSON_VERSION = libs.versions.nlohmannjson.get()

val buildDir = project.layout.buildDirectory.get().asFile
val downloadsDir =
    if (System.getenv("REACT_NATIVE_DOWNLOADS_DIR") != null) {
      File(System.getenv("REACT_NATIVE_DOWNLOADS_DIR"))
    } else {
      File("$buildDir/downloads")
    }
val thirdParty = File("$buildDir/third-party")
val reactNativeRootDir = projectDir.parentFile.parentFile
val reactAndroidBuildDir = File("$reactNativeRootDir/packages/react-native/ReactAndroid/build")
val reactAndroidDownloasdDir =
    File("$reactNativeRootDir/packages/react-native/ReactAndroid/build/downloads")

val createNativeDepsDirectories by
    tasks.registering {
      downloadsDir.mkdirs()
      thirdParty.mkdirs()
    }

val downloadFollyDest = File(reactAndroidDownloasdDir, "folly-${FOLLY_VERSION}.tar.gz")

val prepareFolly by
    tasks.registering(Copy::class) {
      dependsOn(listOf(":packages:react-native:ReactAndroid:downloadFolly"))
      from(tarTree(downloadFollyDest))
      from("tester/third-party/folly/")
      include("folly-${FOLLY_VERSION}/folly/**/*", "CMakeLists.txt")
      eachFile { path = path.substringAfter("/") }
      includeEmptyDirs = false
      into("$thirdParty/folly")
    }

val downloadGflagsDest = File(downloadsDir, "gflags-${GFLAGS_VERSION}.tar.gz")
val downloadGflags by
    tasks.registering(Download::class) {
      dependsOn(createNativeDepsDirectories)
      src("https://github.com/gflags/gflags/archive/v${GFLAGS_VERSION}.tar.gz")
      onlyIfModified(true)
      overwrite(false)
      retries(5)
      quiet(true)
      dest(downloadGflagsDest)
    }

val prepareGflags by
    tasks.registering(PrepareGflagsTask::class) {
      dependsOn(listOf(downloadGflags))
      gflagsPath.setFrom(tarTree(downloadGflagsDest))
      gflagsThirdPartyPath.set(project.file("tester/third-party/gflags/"))
      gflagsVersion.set(GFLAGS_VERSION)
      outputDir.set(File(thirdParty, "gflags"))
    }

val downloadNlohmannJsonDest = File(downloadsDir, "nlohmann_json-${NLOHMANNJSON_VERSION}.tar.gz")
val downloadNlohmannJson by
    tasks.registering(Download::class) {
      dependsOn(createNativeDepsDirectories)
      src("https://github.com/nlohmann/json/archive/v${NLOHMANNJSON_VERSION}.tar.gz")
      onlyIfModified(true)
      overwrite(false)
      retries(5)
      quiet(true)
      dest(downloadNlohmannJsonDest)
    }

val prepareNlohmannJson by
    tasks.registering(Copy::class) {
      dependsOn(listOf(downloadNlohmannJson))
      from(tarTree(downloadNlohmannJsonDest))
      from("tester/third-party/nlohmann_json/")
      include(
          "json-${NLOHMANNJSON_VERSION}/src/**/*",
          "json-${NLOHMANNJSON_VERSION}/include/**/*",
          "CMakeLists.txt")
      eachFile { path = path.substringAfter("/") }
      includeEmptyDirs = false
      into("$thirdParty/nlohmann_json")
    }

var codegenSrcDir = File("$reactAndroidBuildDir/generated/source/codegen/jni")
var codegenOutDir = File("$buildDir/codegen")
val prepareRNCodegen by
    tasks.registering(Copy::class) {
      dependsOn(":packages:react-native:ReactAndroid:generateCodegenArtifactsFromSchema")
      from(codegenSrcDir)
      from("tester/codegen")
      include("react/**/*.h", "react/**/*.cpp", "CMakeLists.txt")
      includeEmptyDirs = false
      duplicatesStrategy = DuplicatesStrategy.INCLUDE
      into(codegenOutDir)
    }

val prepareHermesDependencies by
    tasks.registering {
      dependsOn(
          ":packages:react-native:ReactAndroid:hermes-engine:buildHermesLib",
          ":packages:react-native:ReactAndroid:hermes-engine:prepareHeadersForPrefab",
      )
    }

val prepareNative3pDependencies by
    tasks.registering {
      dependsOn(
          prepareGflags,
          prepareNlohmannJson,
          prepareFolly,
          ":packages:react-native:ReactAndroid:prepareBoost",
          ":packages:react-native:ReactAndroid:prepareDoubleConversion",
          ":packages:react-native:ReactAndroid:prepareFastFloat",
          ":packages:react-native:ReactAndroid:prepareFmt",
          ":packages:react-native:ReactAndroid:prepareGlog",
      )
    }

val prepareAllDependencies by
    tasks.registering {
      dependsOn(prepareRNCodegen, prepareHermesDependencies, prepareNative3pDependencies)
    }
