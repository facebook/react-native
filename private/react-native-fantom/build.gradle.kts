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

val GFLAGS_VERSION = libs.versions.gflags.get()

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

val createNativeDepsDirectories by
    tasks.registering {
      downloadsDir.mkdirs()
      thirdParty.mkdirs()
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

var codegenSrcDir = File("$reactAndroidBuildDir/generated/source/codegen/jni/react")
var codegenOutDir = File("$buildDir/codegen/react")
val prepareRNCodegen by
    tasks.registering(Copy::class) {
      dependsOn(":packages:react-native:ReactAndroid:generateCodegenArtifactsFromSchema")
      from(codegenSrcDir)
      from("tester/codegen/react")
      include(
          "**/FBReactNativeSpecJSI.h", "**/FBReactNativeSpecJSI-generated.cpp", "CMakeLists.txt")
      includeEmptyDirs = false
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
          ":packages:react-native:ReactAndroid:prepareNative3pDependencies",
      )
    }

val prepareAllDependencies by
    tasks.registering {
      dependsOn(prepareRNCodegen, prepareHermesDependencies, prepareNative3pDependencies)
    }
