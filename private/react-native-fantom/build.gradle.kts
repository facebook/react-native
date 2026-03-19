/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import com.android.build.gradle.internal.tasks.factory.dependsOn
import com.facebook.react.internal.PrivateReactExtension
import com.facebook.react.tasks.internal.*
import com.facebook.react.tasks.internal.utils.*
import de.undercouch.gradle.tasks.download.Download

plugins {
  id("com.facebook.react")
  alias(libs.plugins.download)
}

val hermesV1Enabled =
    rootProject.extensions.getByType(PrivateReactExtension::class.java).hermesV1Enabled.get()

// This is the version of CMake we're requesting to the Android SDK to use.
// If missing it will be downloaded automatically. Only CMake versions shipped with the
// Android SDK are supported (you can find them listed in the SDK Manager of Android Studio).
val cmakeVersion = System.getenv("CMAKE_VERSION") ?: "3.30.5"
val cmakePath = "${getSDKPath()}/cmake/$cmakeVersion"
val cmakeBinaryPath = "${cmakePath}/bin/cmake"
val ndkBuildJobs = Runtime.getRuntime().availableProcessors().toString()

fun getSDKPath(): String {
  val androidSdkRoot = System.getenv("ANDROID_SDK_ROOT")
  val androidHome = System.getenv("ANDROID_HOME")
  return when {
    !androidSdkRoot.isNullOrBlank() -> androidSdkRoot
    !androidHome.isNullOrBlank() -> androidHome
    else -> throw IllegalStateException("Neither ANDROID_SDK_ROOT nor ANDROID_HOME is set.")
  }
}

val FOLLY_VERSION = libs.versions.folly.get()
val GFLAGS_VERSION = libs.versions.gflags.get()
val NLOHMANNJSON_VERSION = libs.versions.nlohmannjson.get()
val PANGO_VERSION = "1.50.12"
val GLIB_VERSION = "2.78.3"
val FRIBIDI_VERSION = "1.0.13"
val HARFBUZZ_VERSION = "8.3.0"
val FREETYPE_VERSION = "2.13.2"
val FONTCONFIG_VERSION = "2.14.2"
val EXPAT_VERSION = "2.6.0"
val LIBFFI_VERSION = "3.4.6"

val buildDir = project.layout.buildDirectory.get().asFile
val downloadsDir =
    if (System.getenv("REACT_NATIVE_DOWNLOADS_DIR") != null) {
      File(System.getenv("REACT_NATIVE_DOWNLOADS_DIR"))
    } else {
      File("$buildDir/downloads")
    }
val thirdParty = File("$buildDir/third-party")
val reportsDir = File("$buildDir/reports")
val reactNativeRootDir = projectDir.parentFile.parentFile
val reactNativeDir = File("$reactNativeRootDir/packages/react-native")
val reactAndroidDir = File("$reactNativeDir/ReactAndroid")
val reactAndroidBuildDir = File("$reactAndroidDir/build")
val reactAndroidDownloadsDir =
    if (System.getenv("REACT_NATIVE_DOWNLOADS_DIR") != null) {
      File(System.getenv("REACT_NATIVE_DOWNLOADS_DIR"))
    } else {
      File("$reactAndroidBuildDir/downloads")
    }

val testerDir = File("$projectDir/tester")
val testerBuildDir = File("$buildDir/tester")
val testerBuildOutputFileTree =
    fileTree(testerBuildDir.toString())
        .include("**/*.cmake", "**/*.marks", "**/compiler_depends.ts", "**/Makefile", "**/link.txt")

val createNativeDepsDirectories by
    tasks.registering {
      downloadsDir.mkdirs()
      thirdParty.mkdirs()
      reportsDir.mkdirs()
    }

val downloadFollyDest = File(reactAndroidDownloadsDir, "folly-${FOLLY_VERSION}.tar.gz")

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
          "CMakeLists.txt",
      )
      eachFile { path = path.substringAfter("/") }
      includeEmptyDirs = false
      into("$thirdParty/nlohmann_json")
    }

// --- Pango and its dependencies ---

val downloadFreetypeDest = File(downloadsDir, "freetype-${FREETYPE_VERSION}.tar.gz")
val downloadFreetype by
    tasks.registering(Download::class) {
      dependsOn(createNativeDepsDirectories)
      src("https://download.savannah.gnu.org/releases/freetype/freetype-${FREETYPE_VERSION}.tar.gz")
      onlyIfModified(true)
      overwrite(false)
      retries(5)
      quiet(true)
      dest(downloadFreetypeDest)
    }
val prepareFreetype by
    tasks.registering(Copy::class) {
      dependsOn(listOf(downloadFreetype))
      from(tarTree(downloadFreetypeDest))
      from("tester/third-party/freetype/")
      include("freetype-${FREETYPE_VERSION}/**/*", "CMakeLists.txt")
      eachFile { path = path.substringAfter("/") }
      includeEmptyDirs = false
      into("$thirdParty/freetype")
    }

val downloadHarfbuzzDest = File(downloadsDir, "harfbuzz-${HARFBUZZ_VERSION}.tar.gz")
val downloadHarfbuzz by
    tasks.registering(Download::class) {
      dependsOn(createNativeDepsDirectories)
      src(
          "https://github.com/harfbuzz/harfbuzz/releases/download/${HARFBUZZ_VERSION}/harfbuzz-${HARFBUZZ_VERSION}.tar.gz"
      )
      onlyIfModified(true)
      overwrite(false)
      retries(5)
      quiet(true)
      dest(downloadHarfbuzzDest)
    }
val prepareHarfbuzz by
    tasks.registering(Copy::class) {
      dependsOn(listOf(downloadHarfbuzz))
      from(tarTree(downloadHarfbuzzDest))
      from("tester/third-party/harfbuzz/")
      include("harfbuzz-${HARFBUZZ_VERSION}/**/*", "CMakeLists.txt")
      eachFile { path = path.substringAfter("/") }
      includeEmptyDirs = false
      into("$thirdParty/harfbuzz")
    }

val downloadExpatDest = File(downloadsDir, "expat-${EXPAT_VERSION}.tar.gz")
val downloadExpat by
    tasks.registering(Download::class) {
      dependsOn(createNativeDepsDirectories)
      src(
          "https://github.com/libexpat/libexpat/releases/download/R_2_6_0/expat-${EXPAT_VERSION}.tar.gz"
      )
      onlyIfModified(true)
      overwrite(false)
      retries(5)
      quiet(true)
      dest(downloadExpatDest)
    }
val prepareExpat by
    tasks.registering(Copy::class) {
      dependsOn(listOf(downloadExpat))
      from(tarTree(downloadExpatDest))
      from("tester/third-party/expat/")
      include("expat-${EXPAT_VERSION}/**/*", "CMakeLists.txt")
      eachFile { path = path.substringAfter("/") }
      includeEmptyDirs = false
      into("$thirdParty/expat")
    }

val downloadLibffiDest = File(downloadsDir, "libffi-${LIBFFI_VERSION}.tar.gz")
val downloadLibffi by
    tasks.registering(Download::class) {
      dependsOn(createNativeDepsDirectories)
      src(
          "https://github.com/libffi/libffi/releases/download/v${LIBFFI_VERSION}/libffi-${LIBFFI_VERSION}.tar.gz"
      )
      onlyIfModified(true)
      overwrite(false)
      retries(5)
      quiet(true)
      dest(downloadLibffiDest)
    }
val prepareLibffi by
    tasks.registering(Copy::class) {
      dependsOn(listOf(downloadLibffi))
      from(tarTree(downloadLibffiDest))
      from("tester/third-party/libffi/")
      include("libffi-${LIBFFI_VERSION}/**/*", "CMakeLists.txt")
      eachFile { path = path.substringAfter("/") }
      includeEmptyDirs = false
      into("$thirdParty/libffi")
    }

val downloadFribidiDest = File(downloadsDir, "fribidi-${FRIBIDI_VERSION}.tar.gz")
val downloadFribidi by
    tasks.registering(Download::class) {
      dependsOn(createNativeDepsDirectories)
      src(
          "https://github.com/fribidi/fribidi/releases/download/v${FRIBIDI_VERSION}/fribidi-${FRIBIDI_VERSION}.tar.gz"
      )
      onlyIfModified(true)
      overwrite(false)
      retries(5)
      quiet(true)
      dest(downloadFribidiDest)
    }
val prepareFribidi by
    tasks.registering(Copy::class) {
      dependsOn(listOf(downloadFribidi))
      from(tarTree(downloadFribidiDest))
      from("tester/third-party/fribidi/")
      include("fribidi-${FRIBIDI_VERSION}/**/*", "CMakeLists.txt", "fribidi-config.h")
      eachFile { path = path.substringAfter("/") }
      includeEmptyDirs = false
      into("$thirdParty/fribidi")
    }

val downloadGlibDest = File(downloadsDir, "glib-${GLIB_VERSION}.tar.gz")
val downloadGlib by
    tasks.registering(Download::class) {
      dependsOn(createNativeDepsDirectories)
      src("https://download.gnome.org/sources/glib/2.78/glib-${GLIB_VERSION}.tar.gz")
      onlyIfModified(true)
      overwrite(false)
      retries(5)
      quiet(true)
      dest(downloadGlibDest)
    }
val prepareGlib by
    tasks.registering(Copy::class) {
      dependsOn(listOf(downloadGlib))
      from(tarTree(downloadGlibDest))
      from("tester/third-party/glib/")
      include("glib-${GLIB_VERSION}/**/*", "CMakeLists.txt", "glibconfig.h", "config.h")
      eachFile { path = path.substringAfter("/") }
      includeEmptyDirs = false
      into("$thirdParty/glib")
    }

val downloadFontconfigDest = File(downloadsDir, "fontconfig-${FONTCONFIG_VERSION}.tar.gz")
val downloadFontconfig by
    tasks.registering(Download::class) {
      dependsOn(createNativeDepsDirectories)
      src(
          "https://www.freedesktop.org/software/fontconfig/release/fontconfig-${FONTCONFIG_VERSION}.tar.gz"
      )
      onlyIfModified(true)
      overwrite(false)
      retries(5)
      quiet(true)
      dest(downloadFontconfigDest)
    }
val prepareFontconfig by
    tasks.registering(Copy::class) {
      dependsOn(listOf(downloadFontconfig))
      from(tarTree(downloadFontconfigDest))
      from("tester/third-party/fontconfig/")
      include("fontconfig-${FONTCONFIG_VERSION}/**/*", "CMakeLists.txt", "fcstdint.h", "config.h")
      eachFile { path = path.substringAfter("/") }
      includeEmptyDirs = false
      into("$thirdParty/fontconfig")
    }

val downloadPangoDest = File(downloadsDir, "pango-${PANGO_VERSION}.tar.gz")
val downloadPango by
    tasks.registering(Download::class) {
      dependsOn(createNativeDepsDirectories)
      src("https://download.gnome.org/sources/pango/1.50/pango-${PANGO_VERSION}.tar.gz")
      onlyIfModified(true)
      overwrite(false)
      retries(5)
      quiet(true)
      dest(downloadPangoDest)
    }
val preparePango by
    tasks.registering(Copy::class) {
      dependsOn(listOf(downloadPango))
      from(tarTree(downloadPangoDest))
      from("tester/third-party/pango/")
      include("pango-${PANGO_VERSION}/**/*", "CMakeLists.txt", "config.h", "pango-features.h")
      eachFile { path = path.substringAfter("/") }
      includeEmptyDirs = false
      into("$thirdParty/pango")
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

val enableHermesBuild by
    tasks.registering {
      project(":packages:react-native:ReactAndroid:hermes-engine") {
        tasks.configureEach { enabled = true }
      }
    }

val prepareHermesDependencies by
    tasks.registering {
      dependsOn(
          enableHermesBuild,
          ":packages:react-native:ReactAndroid:hermes-engine:buildHermesLibWithDebugger",
          ":packages:react-native:ReactAndroid:hermes-engine:prepareHeadersForPrefabWithDebugger",
      )
    }

val prepareNative3pDependencies by
    tasks.registering {
      dependsOn(
          prepareGflags,
          prepareNlohmannJson,
          prepareFolly,
          prepareFreetype,
          prepareHarfbuzz,
          prepareExpat,
          prepareLibffi,
          prepareFribidi,
          prepareGlib,
          prepareFontconfig,
          preparePango,
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

val configureFantomTester by
    tasks.registering(CustomExecTask::class) {
      dependsOn(prepareAllDependencies)
      workingDir(testerDir)
      inputs.dir(testerDir)
      outputs.files(testerBuildOutputFileTree)
      val cmdArgs =
          mutableListOf(
              cmakeBinaryPath,
              // Suppress all warnings as this is the Hermes build and we can't fix them.
              "--log-level=ERROR",
              "-S",
              ".",
              "-B",
              testerBuildDir.toString(),
              "-DCMAKE_BUILD_TYPE=Debug",
              "-DFANTOM_CODEGEN_DIR=$buildDir/codegen",
              "-DFANTOM_THIRD_PARTY_DIR=$buildDir/third-party",
              "-DREACT_ANDROID_DIR=$reactAndroidDir",
              "-DREACT_COMMON_DIR=$reactNativeDir/ReactCommon",
              "-DREACT_CXX_PLATFORM_DIR=$reactNativeDir/ReactCxxPlatform",
              "-DREACT_THIRD_PARTY_NDK_DIR=$reactAndroidBuildDir/third-party-ndk",
              "-DRN_ENABLE_DEBUG_STRING_CONVERTIBLE=ON",
          )

      if (hermesV1Enabled) {
        cmdArgs.add("-DHERMES_V1_ENABLED=1")
      }

      commandLine(cmdArgs)
      standardOutputFile.set(project.file("$buildDir/reports/configure-fantom_tester.log"))
      errorOutputFile.set(project.file("$buildDir/reports/configure-fantom_tester.error.log"))
    }

val buildFantomTester by
    tasks.registering(CustomExecTask::class) {
      dependsOn(configureFantomTester)
      workingDir(testerDir)
      inputs.files(testerBuildOutputFileTree)
      commandLine(
          cmakeBinaryPath,
          "--build",
          testerBuildDir.toString(),
          "--target",
          "fantom_tester",
          "-j",
          ndkBuildJobs,
      )
      standardOutputFile.set(project.file("$buildDir/reports/build-fantom_tester.log"))
      errorOutputFile.set(project.file("$buildDir/reports/build-fantom_tester.error.log"))
    }
