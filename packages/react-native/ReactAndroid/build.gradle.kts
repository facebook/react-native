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
import java.nio.file.Paths
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
  id("maven-publish")
  id("com.facebook.react")
  alias(libs.plugins.android.library)
  alias(libs.plugins.download)
  alias(libs.plugins.kotlin.android)
}

version = project.findProperty("VERSION_NAME")?.toString()!!

group = "com.facebook.react"

// We download various C++ open-source dependencies into downloads.
// We then copy both the downloaded code and our custom makefiles and headers into third-party-ndk.
// After that we build native code from src/main/jni with module path pointing at third-party-ndk.
val buildDir = project.layout.buildDirectory.get().asFile
val downloadsDir =
    if (System.getenv("REACT_NATIVE_DOWNLOADS_DIR") != null) {
      File(System.getenv("REACT_NATIVE_DOWNLOADS_DIR"))
    } else {
      File("$buildDir/downloads")
    }
val thirdPartyNdkDir = File("$buildDir/third-party-ndk")
val reactNativeRootDir = projectDir.parent

// We put the publishing version from gradle.properties inside ext. so other
// subprojects can access it as well.
extra["publishing_version"] = project.findProperty("VERSION_NAME")?.toString()!!

// This is the version of CMake we're requesting to the Android SDK to use.
// If missing it will be downloaded automatically. Only CMake versions shipped with the
// Android SDK are supported (you can find them listed in the SDK Manager of Android Studio).
val cmakeVersion = System.getenv("CMAKE_VERSION") ?: "3.22.1"

extra["cmake_version"] = cmakeVersion

// You need to have following folders in this directory:
//   - boost_1_83_0
//   - double-conversion-1.1.6
//   - folly-deprecate-dynamic-initializer
//   - glog-0.3.5
val dependenciesPath = System.getenv("REACT_NATIVE_DEPENDENCIES")

// The Boost library is a very large download (>100MB).
// If Boost is already present on your system, define the REACT_NATIVE_BOOST_PATH env variable
// and the build will use that.
val boostPathOverride = dependenciesPath ?: System.getenv("REACT_NATIVE_BOOST_PATH")

val prefabHeadersDir = project.file("$buildDir/prefab-headers")

// Native versions which are defined inside the version catalog (libs.versions.toml)
val BOOST_VERSION = libs.versions.boost.get()
val DOUBLE_CONVERSION_VERSION = libs.versions.doubleconversion.get()
val FAST_FLOAT_VERSION = libs.versions.fastFloat.get()
val FMT_VERSION = libs.versions.fmt.get()
val FOLLY_VERSION = libs.versions.folly.get()
val GLOG_VERSION = libs.versions.glog.get()
val GTEST_VERSION = libs.versions.gtest.get()

val preparePrefab by
    tasks.registering(PreparePrefabHeadersTask::class) {
      dependsOn(prepareBoost, prepareDoubleConversion, prepareFolly, prepareGlog)
      dependsOn("generateCodegenArtifactsFromSchema")
      // To export to a ReactNativePrefabProcessingEntities.kt once all
      // libraries have been moved. We keep it here for now as it make easier to
      // migrate one library at a time.
      input.set(
          listOf(
              PrefabPreprocessingEntry("jsi", Pair("../ReactCommon/jsi/", "")),
              PrefabPreprocessingEntry(
                  "reactnative",
                  listOf(
                      // hermes_executor
                      // This prefab targets is used by Expo & Reanimated
                      Pair("../ReactCommon/hermes/inspector-modern/", "hermes/inspector-modern/"),
                      // jscexecutor
                      Pair("../ReactCommon/jsc/", "jsc/"),
                      // fabricjni
                      Pair("src/main/jni/react/fabric", "react/fabric/"),
                      // glog
                      Pair(File(buildDir, "third-party-ndk/glog/exported/").absolutePath, ""),
                      // jsiinpsector
                      Pair("../ReactCommon/jsinspector-modern/", "jsinspector-modern/"),
                      // mapbufferjni
                      Pair("src/main/jni/react/mapbuffer", "react/mapbuffer/"),
                      // turbomodulejsijni
                      Pair("src/main/jni/react/turbomodule", ""),
                      // react_codegen_rncore
                      Pair(File(buildDir, "generated/source/codegen/jni/").absolutePath, ""),
                      // reactnativejni
                      Pair("src/main/jni/react/jni", "react/jni/"),
                      Pair("../ReactCommon/cxxreact/", "cxxreact/"),
                      // react_featureflags
                      Pair("../ReactCommon/react/featureflags/", "react/featureflags/"),
                      // react_devtoolsruntimesettings
                      Pair(
                          "../ReactCommon/react/devtoolsruntimesettings/",
                          "react/devtoolsruntimesettings/"),
                      // react_render_animations
                      Pair(
                          "../ReactCommon/react/renderer/animations/",
                          "react/renderer/animations/"),
                      // react_render_componentregistry
                      Pair(
                          "../ReactCommon/react/renderer/componentregistry/",
                          "react/renderer/componentregistry/"),
                      // react_render_consistency
                      Pair(
                          "../ReactCommon/react/renderer/consistency/",
                          "react/renderer/consistency/"),
                      // react_render_core
                      Pair("../ReactCommon/react/renderer/core/", "react/renderer/core/"),
                      // react_debug
                      Pair("../ReactCommon/react/debug/", "react/debug/"),
                      // react_render_debug
                      Pair("../ReactCommon/react/renderer/debug/", "react/renderer/debug/"),
                      // react_render_graphics
                      Pair("../ReactCommon/react/renderer/graphics/", "react/renderer/graphics/"),
                      Pair("../ReactCommon/react/renderer/graphics/platform/android/", ""),
                      // react_render_imagemanager
                      Pair(
                          "../ReactCommon/react/renderer/imagemanager/",
                          "react/renderer/imagemanager/"),
                      Pair("../ReactCommon/react/renderer/imagemanager/platform/cxx/", ""),
                      // react_render_mounting
                      Pair("../ReactCommon/react/renderer/mounting/", "react/renderer/mounting/"),
                      // react_render_scheduler
                      Pair("../ReactCommon/react/renderer/scheduler/", "react/renderer/scheduler/"),
                      // react_render_uimanager
                      Pair("../ReactCommon/react/renderer/uimanager/", "react/renderer/uimanager/"),
                      // react_utils
                      Pair("../ReactCommon/react/utils/", "react/utils/"),
                      // rrc_image
                      Pair(
                          "../ReactCommon/react/renderer/components/image/",
                          "react/renderer/components/image/"),
                      // rrc_view
                      Pair(
                          "../ReactCommon/react/renderer/components/view/",
                          "react/renderer/components/view/"),
                      Pair("../ReactCommon/react/renderer/components/view/platform/android/", ""),
                      // rrc_root
                      Pair(
                          "../ReactCommon/react/renderer/components/root/",
                          "react/renderer/components/root/"),
                      // runtimeexecutor
                      Pair("../ReactCommon/runtimeexecutor/", ""),
                      // react_render_textlayoutmanager
                      Pair(
                          "../ReactCommon/react/renderer/textlayoutmanager/",
                          "react/renderer/textlayoutmanager/"),
                      Pair("../ReactCommon/react/renderer/textlayoutmanager/platform/android/", ""),
                      // rrc_text
                      Pair(
                          "../ReactCommon/react/renderer/components/text/",
                          "react/renderer/components/text/"),
                      Pair(
                          "../ReactCommon/react/renderer/attributedstring",
                          "react/renderer/attributedstring"),
                      // rrc_textinput
                      Pair(
                          "../ReactCommon/react/renderer/components/textinput/",
                          "react/renderer/components/textinput/"),
                      Pair(
                          "../ReactCommon/react/renderer/components/textinput/platform/android/",
                          ""),
                      // react_newarchdefaults
                      Pair("src/main/jni/react/newarchdefaults", ""),
                      // react_nativemodule_core
                      Pair(File(buildDir, "third-party-ndk/boost/boost_1_83_0/").absolutePath, ""),
                      Pair(File(buildDir, "third-party-ndk/double-conversion/").absolutePath, ""),
                      Pair(File(buildDir, "third-party-ndk/fast_float/include/").absolutePath, ""),
                      Pair(File(buildDir, "third-party-ndk/fmt/include/").absolutePath, ""),
                      Pair(File(buildDir, "third-party-ndk/folly/").absolutePath, ""),
                      Pair(File(buildDir, "third-party-ndk/glog/exported/").absolutePath, ""),
                      Pair("../ReactCommon/callinvoker/", ""),
                      Pair("../ReactCommon/cxxreact/", "cxxreact/"),
                      Pair("../ReactCommon/react/bridging/", "react/bridging/"),
                      Pair("../ReactCommon/react/config/", "react/config/"),
                      Pair("../ReactCommon/react/nativemodule/core/", ""),
                      Pair("../ReactCommon/react/nativemodule/core/platform/android/", ""),
                      Pair(
                          "../ReactCommon/react/renderer/componentregistry/",
                          "react/renderer/componentregistry/"),
                      Pair(
                          "../ReactCommon/react/renderer/components/root/",
                          "react/renderer/components/root/"),
                      Pair("../ReactCommon/react/renderer/core/", "react/renderer/core/"),
                      Pair("../ReactCommon/react/renderer/debug/", "react/renderer/debug/"),
                      Pair(
                          "../ReactCommon/react/renderer/leakchecker/",
                          "react/renderer/leakchecker/"),
                      Pair("../ReactCommon/react/renderer/mapbuffer/", "react/renderer/mapbuffer/"),
                      Pair("../ReactCommon/react/renderer/mounting/", "react/renderer/mounting/"),
                      Pair(
                          "../ReactCommon/react/renderer/runtimescheduler/",
                          "react/renderer/runtimescheduler/"),
                      Pair("../ReactCommon/react/renderer/scheduler/", "react/renderer/scheduler/"),
                      Pair("../ReactCommon/react/renderer/telemetry/", "react/renderer/telemetry/"),
                      Pair("../ReactCommon/react/renderer/uimanager/", "react/renderer/uimanager/"),
                      Pair("../ReactCommon/react/debug/", "react/debug/"),
                      Pair("../ReactCommon/react/utils/", "react/utils/"),
                      Pair("src/main/jni/react/jni", "react/jni/"),
                      // react_cxxreactpackage
                      Pair("src/main/jni/react/runtime/cxxreactpackage", ""),
                      // react_performance_timeline
                      Pair(
                          "../ReactCommon/react/performance/timeline/",
                          "react/performance/timeline/"),
                      // react_render_observers_events
                      Pair(
                          "../ReactCommon/react/renderer/observers/events/",
                          "react/renderer/observers/events/"),
                      // react_timing
                      Pair("../ReactCommon/react/timing/", "react/timing/"),
                      // yoga
                      Pair("../ReactCommon/yoga/", ""),
                      Pair("src/main/jni/first-party/yogajni/jni", ""),
                  )),
              PrefabPreprocessingEntry(
                  "hermestooling",
                  // hermes_executor
                  Pair("../ReactCommon/hermes/inspector-modern/", "hermes/inspector-modern/")),
              PrefabPreprocessingEntry(
                  "jsctooling",
                  // jsc
                  Pair("../ReactCommon/jsc/", "jsc/")),
          ))
      outputDir.set(prefabHeadersDir)
    }

val createNativeDepsDirectories by
    tasks.registering {
      downloadsDir.mkdirs()
      thirdPartyNdkDir.mkdirs()
    }

val downloadBoost by
    tasks.creating(Download::class) {
      dependsOn(createNativeDepsDirectories)
      src(
          "https://archives.boost.io/release/${BOOST_VERSION.replace("_", ".")}/source/boost_${BOOST_VERSION}.tar.gz")
      onlyIfModified(true)
      overwrite(false)
      retries(5)
      quiet(true)
      dest(File(downloadsDir, "boost_${BOOST_VERSION}.tar.gz"))
    }

val prepareBoost by
    tasks.registering(PrepareBoostTask::class) {
      dependsOn(if (boostPathOverride != null) emptyList() else listOf(downloadBoost))
      boostPath.setFrom(if (boostPathOverride != null) boostPath else tarTree(downloadBoost.dest))
      boostVersion.set(BOOST_VERSION)
      outputDir.set(File(thirdPartyNdkDir, "boost"))
    }

val downloadDoubleConversion by
    tasks.creating(Download::class) {
      dependsOn(createNativeDepsDirectories)
      src(
          "https://github.com/google/double-conversion/archive/v${DOUBLE_CONVERSION_VERSION}.tar.gz")
      onlyIfModified(true)
      overwrite(false)
      retries(5)
      quiet(true)
      dest(File(downloadsDir, "double-conversion-${DOUBLE_CONVERSION_VERSION}.tar.gz"))
    }

val prepareDoubleConversion by
    tasks.registering(Copy::class) {
      dependsOn(if (dependenciesPath != null) emptyList() else listOf(downloadDoubleConversion))
      from(dependenciesPath ?: tarTree(downloadDoubleConversion.dest))
      from("src/main/jni/third-party/double-conversion/")
      include("double-conversion-${DOUBLE_CONVERSION_VERSION}/src/**/*", "CMakeLists.txt")
      filesMatching("*/src/**/*") { this.path = "double-conversion/${this.name}" }
      includeEmptyDirs = false
      into("$thirdPartyNdkDir/double-conversion")
    }

val downloadFolly by
    tasks.creating(Download::class) {
      src("https://github.com/facebook/folly/archive/v${FOLLY_VERSION}.tar.gz")
      onlyIfModified(true)
      overwrite(false)
      retries(5)
      quiet(true)
      dest(File(downloadsDir, "folly-${FOLLY_VERSION}.tar.gz"))
    }

val prepareFolly by
    tasks.registering(Copy::class) {
      dependsOn(if (dependenciesPath != null) emptyList() else listOf(downloadFolly))
      from(dependenciesPath ?: tarTree(downloadFolly.dest))
      from("src/main/jni/third-party/folly/")
      include("folly-${FOLLY_VERSION}/folly/**/*", "CMakeLists.txt")
      eachFile { this.path = this.path.removePrefix("folly-${FOLLY_VERSION}/") }
      includeEmptyDirs = false
      into("$thirdPartyNdkDir/folly")
    }

val downloadFastFloat by
    tasks.creating(Download::class) {
      dependsOn(createNativeDepsDirectories)
      src("https://github.com/fastfloat/fast_float/archive/v${FAST_FLOAT_VERSION}.tar.gz")
      onlyIfModified(true)
      overwrite(false)
      retries(5)
      quiet(true)
      dest(File(downloadsDir, "fast_float-${FAST_FLOAT_VERSION}.tar.gz"))
    }

val prepareFastFloat by
    tasks.registering(Copy::class) {
      dependsOn(if (dependenciesPath != null) emptyList() else listOf(downloadFastFloat))
      from(dependenciesPath ?: tarTree(downloadFastFloat.dest))
      from("src/main/jni/third-party/fast_float/")
      include("fast_float-${FAST_FLOAT_VERSION}/include/**/*", "CMakeLists.txt")
      eachFile { this.path = this.path.removePrefix("fast_float-${FAST_FLOAT_VERSION}/") }
      includeEmptyDirs = false
      into("$thirdPartyNdkDir/fast_float")
    }

val downloadFmt by
    tasks.creating(Download::class) {
      dependsOn(createNativeDepsDirectories)
      src("https://github.com/fmtlib/fmt/archive/${FMT_VERSION}.tar.gz")
      onlyIfModified(true)
      overwrite(false)
      retries(5)
      quiet(true)
      dest(File(downloadsDir, "fmt-${FMT_VERSION}.tar.gz"))
    }

val prepareFmt by
    tasks.registering(Copy::class) {
      dependsOn(if (dependenciesPath != null) emptyList() else listOf(downloadFmt))
      from(dependenciesPath ?: tarTree(downloadFmt.dest))
      from("src/main/jni/third-party/fmt/")
      include("fmt-${FMT_VERSION}/src/**/*", "fmt-${FMT_VERSION}/include/**/*", "CMakeLists.txt")
      eachFile { this.path = this.path.removePrefix("fmt-${FMT_VERSION}/") }
      includeEmptyDirs = false
      into("$thirdPartyNdkDir/fmt")
    }

val downloadGlog by
    tasks.creating(Download::class) {
      dependsOn(createNativeDepsDirectories)
      src("https://github.com/google/glog/archive/v${GLOG_VERSION}.tar.gz")
      onlyIfModified(true)
      overwrite(false)
      retries(5)
      quiet(true)
      dest(File(downloadsDir, "glog-${GLOG_VERSION}.tar.gz"))
    }

val downloadGtest by
    tasks.creating(Download::class) {
      dependsOn(createNativeDepsDirectories)
      src("https://github.com/google/googletest/archive/refs/tags/release-${GTEST_VERSION}.tar.gz")
      onlyIfModified(true)
      overwrite(false)
      retries(5)
      quiet(true)
      dest(File(downloadsDir, "gtest.tar.gz"))
    }

val prepareGtest by
    tasks.registering(Copy::class) {
      dependsOn(if (dependenciesPath != null) emptyList() else listOf(downloadGtest))
      from(dependenciesPath ?: tarTree(downloadGtest.dest))
      eachFile { this.path = (this.path.removePrefix("googletest-release-${GTEST_VERSION}/")) }
      into(File(thirdPartyNdkDir, "googletest"))
    }

val prepareGlog by
    tasks.registering(PrepareGlogTask::class) {
      dependsOn(if (dependenciesPath != null) emptyList() else listOf(downloadGlog))
      glogPath.setFrom(dependenciesPath ?: tarTree(downloadGlog.dest))
      glogVersion.set(GLOG_VERSION)
      outputDir.set(File(thirdPartyNdkDir, "glog"))
    }

// Create Android native library module based on jsc from npm
val prepareJSC by
    tasks.registering(PrepareJSCTask::class) {
      jscPackagePath.set(findNodeModulePath(projectDir, "jsc-android"))
      outputDir = project.layout.buildDirectory.dir("third-party-ndk/jsc")
    }

val prepareKotlinBuildScriptModel by
    tasks.registering {
      // This task is run when Gradle Sync is running.
      // We create it here so we can let it depend on preBuild inside the android{}
    }

// As ReactAndroid builds from source, the codegen needs to be built before it can be invoked.
// This is not the case for users of React Native, as we ship a compiled version of the codegen.
val buildCodegenCLI by
    tasks.registering(BuildCodegenCLITask::class) {
      codegenDir.set(file("$rootDir/node_modules/@react-native/codegen"))
      bashWindowsHome.set(project.findProperty("react.internal.windowsBashPath").toString())
      onlyIf {
        // For build from source scenario, we don't need to build the codegen at all.
        rootProject.name != "react-native-build-from-source"
      }
    }

/**
 * Finds the path of the installed npm package with the given name using Node's module resolution
 * algorithm, which searches "node_modules" directories up to the file system root. This handles
 * various cases, including:
 * - Working in the open-source RN repo: Gradle: /path/to/react-native/ReactAndroid Node module:
 *   /path/to/react-native/node_modules/<package>
 * - Installing RN as a dependency of an app and searching for hoisted dependencies: Gradle:
 *   /path/to/app/node_modules/react-native/ReactAndroid Node module:
 *   /path/to/app/node_modules/<package>
 * - Working in a larger repo (e.g., Facebook) that contains RN: Gradle:
 *   /path/to/repo/path/to/react-native/ReactAndroid Node module:
 *   /path/to/repo/node_modules/<package>
 *
 * The search begins at the given base directory (a File object). The returned path is a string.
 */
fun findNodeModulePath(baseDir: File, packageName: String): String? {
  var basePath: java.nio.file.Path? = baseDir.toPath().normalize()
  // Node's module resolution algorithm searches up to the root directory,
  // after which the base path will be null
  while (basePath != null) {
    val candidatePath = Paths.get(basePath.toString(), "node_modules", packageName)
    if (candidatePath.toFile().exists()) {
      return candidatePath.toString()
    }
    basePath = basePath.parent
  }
  return null
}

fun reactNativeDevServerPort(): String {
  val value = project.properties["reactNativeDevServerPort"]
  return value?.toString() ?: "8081"
}

fun reactNativeArchitectures(): List<String> {
  val value = project.properties["reactNativeArchitectures"]
  return value?.toString()?.split(",") ?: listOf("armeabi-v7a", "x86", "x86_64", "arm64-v8a")
}

fun enableWarningsAsErrors(): Boolean {
  val value = project.properties["enableWarningsAsErrors"]
  return value?.toString()?.toBoolean() ?: false
}

val packageReactNdkLibsForBuck by
    tasks.registering(Copy::class) {
      dependsOn("mergeDebugNativeLibs")
      // Shared libraries (.so) are copied from the merged_native_libs folder instead
      from("$buildDir/intermediates/merged_native_libs/debug/out/lib/")
      exclude("**/libjsc.so")
      exclude("**/libhermes.so")
      into("src/main/jni/prebuilt/lib")
    }

repositories {
  // Normally RNGP will set repositories for all modules,
  // but when consumed from source, we need to re-declare
  // those repositories as there is no app module there.
  mavenCentral()
  google()
}

android {
  compileSdk = libs.versions.compileSdk.get().toInt()
  buildToolsVersion = libs.versions.buildTools.get()
  namespace = "com.facebook.react"

  // Used to override the NDK path/version on internal CI or by allowing
  // users to customize the NDK path/version from their root project (e.g. for Apple Silicon
  // support)
  if (rootProject.hasProperty("ndkPath") && rootProject.properties["ndkPath"] != null) {
    ndkPath = rootProject.properties["ndkPath"].toString()
  }
  if (rootProject.hasProperty("ndkVersion") && rootProject.properties["ndkVersion"] != null) {
    ndkVersion = rootProject.properties["ndkVersion"].toString()
  } else {
    ndkVersion = libs.versions.ndkVersion.get()
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }

  kotlinOptions {
    // Using '-Xjvm-default=all' to generate default java methods for interfaces
    freeCompilerArgs = listOf("-Xjvm-default=all")
    // Using -PenableWarningsAsErrors=true prop to enable allWarningsAsErrors
    kotlinOptions.allWarningsAsErrors = enableWarningsAsErrors()
  }

  defaultConfig {
    minSdk = libs.versions.minSdk.get().toInt()

    consumerProguardFiles("proguard-rules.pro")

    buildConfigField("boolean", "IS_INTERNAL_BUILD", "false")
    buildConfigField("int", "EXOPACKAGE_FLAGS", "0")
    buildConfigField("boolean", "UNSTABLE_ENABLE_FUSEBOX_RELEASE", "false")

    resValue("integer", "react_native_dev_server_port", reactNativeDevServerPort())

    testApplicationId = "com.facebook.react.tests.gradle"
    testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

    externalNativeBuild {
      cmake {
        arguments(
            "-DREACT_COMMON_DIR=${reactNativeRootDir}/ReactCommon",
            "-DREACT_ANDROID_DIR=$projectDir",
            "-DREACT_BUILD_DIR=$buildDir",
            "-DANDROID_STL=c++_shared",
            "-DANDROID_TOOLCHAIN=clang",
            "-DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON")

        targets(
            "reactnative",
            "jsi",
            "hermestooling",
            "jsctooling",
        )
      }
    }
    ndk { abiFilters.addAll(reactNativeArchitectures()) }
  }

  externalNativeBuild {
    cmake {
      version = cmakeVersion
      path("src/main/jni/CMakeLists.txt")
    }
  }

  buildTypes {
    debug {
      externalNativeBuild {
        cmake {
          // We want to build Gtest suite only for the debug variant.
          targets("reactnative_unittest")
        }
      }
    }
  }

  tasks
      .getByName("preBuild")
      .dependsOn(
          buildCodegenCLI,
          "generateCodegenArtifactsFromSchema",
          prepareBoost,
          prepareDoubleConversion,
          prepareFastFloat,
          prepareFmt,
          prepareFolly,
          prepareGlog,
          prepareGtest,
          prepareJSC,
          preparePrefab)
  tasks.getByName("generateCodegenSchemaFromJavaScript").dependsOn(buildCodegenCLI)
  prepareKotlinBuildScriptModel.dependsOn("preBuild")
  prepareKotlinBuildScriptModel.dependsOn(
      ":packages:react-native:ReactAndroid:hermes-engine:preBuild")

  sourceSets.getByName("main") {
    res.setSrcDirs(
        listOf(
            "src/main/res/devsupport",
            "src/main/res/shell",
            "src/main/res/views/alert",
            "src/main/res/views/modal",
            "src/main/res/views/uimanager"))
    java.exclude("com/facebook/react/processing")
    java.exclude("com/facebook/react/module/processing")
  }

  lint {
    abortOnError = false
    targetSdk = libs.versions.targetSdk.get().toInt()
  }

  packaging {
    resources.excludes.add("META-INF/NOTICE")
    resources.excludes.add("META-INF/LICENSE")
    // We intentionally don't want to bundle any JS Runtime inside the Android AAR
    // we produce. The reason behind this is that we want to allow users to pick the
    // JS engine by specifying a dependency on either `hermes-engine` or `android-jsc`
    // that will include the necessary .so files to load.
    jniLibs.excludes.add("**/libhermes.so")
    jniLibs.excludes.add("**/libjsc.so")
  }

  buildFeatures {
    prefab = true
    prefabPublishing = true
    buildConfig = true
  }

  prefab {
    create("jsi") { headers = File(prefabHeadersDir, "jsi").absolutePath }
    create("reactnative") { headers = File(prefabHeadersDir, "reactnative").absolutePath }
    create("hermestooling") { headers = File(prefabHeadersDir, "hermestooling").absolutePath }
    create("jsctooling") { headers = File(prefabHeadersDir, "jsctooling").absolutePath }
  }

  publishing {
    multipleVariants {
      withSourcesJar()
      includeBuildTypeValues("debug", "release")
    }
  }

  testOptions {
    unitTests { isIncludeAndroidResources = true }
    targetSdk = libs.versions.targetSdk.get().toInt()
  }
}

tasks.withType<KotlinCompile>().configureEach { exclude("com/facebook/annotationprocessors/**") }

dependencies {
  api(libs.androidx.appcompat)
  api(libs.androidx.appcompat.resources)
  api(libs.androidx.autofill)
  api(libs.androidx.swiperefreshlayout)
  api(libs.androidx.tracing)

  api(libs.fbjni)
  api(libs.fresco)
  api(libs.fresco.imagepipeline.okhttp3)
  api(libs.fresco.middleware)
  api(libs.fresco.ui.common)
  api(libs.infer.annotation)
  api(libs.soloader)
  api(libs.yoga.proguard.annotations)

  api(libs.jsr305)
  api(libs.okhttp3.urlconnection)
  api(libs.okhttp3)
  api(libs.okio)
  compileOnly(libs.javax.annotation.api)
  api(libs.javax.inject)

  // It's up to the consumer to decide if hermes should be included or not.
  // Therefore hermes-engine is a compileOnly dependency.
  compileOnly(project(":packages:react-native:ReactAndroid:hermes-engine"))

  testImplementation(libs.junit)
  testImplementation(libs.assertj)
  testImplementation(libs.mockito)
  testImplementation(libs.robolectric)
  testImplementation(libs.thoughtworks)
}

react {
  // TODO: The library name is chosen for parity with Fabric components & iOS
  // This should be changed to a more generic name, e.g. `ReactCoreSpec`.
  libraryName = "rncore"
  jsRootDir = file("../src")
}

// For build from source, we need to override the privateReact extension.
// This is needed as the build-from-source won't have a com.android.application
// module to apply the plugin to, so it's codegenDir and reactNativeDir won't be evaluated.
if (rootProject.name == "react-native-build-from-source") {
  rootProject.extensions.getByType(PrivateReactExtension::class.java).apply {
    // We try to guess where codegen lives. Generally is inside
    // node_modules/@react-native/codegen. If the file is not existing, we
    // fallback to ../react-native-codegen (used for hello-world app).
    codegenDir =
        if (file("$rootDir/../@react-native/codegen").exists()) {
          file("$rootDir/../@react-native/codegen")
        } else {
          file("$rootDir/../react-native-codegen")
        }
    reactNativeDir = file("$rootDir")
  }
}

kotlin {
  jvmToolchain(17)
  explicitApi()
}

tasks.withType<Test> { jvmArgs = listOf("-Xshare:off") }

/* Publishing Configuration */
apply(from = "./publish.gradle")

// We need to override the artifact ID as this project is called `ReactAndroid` but
// the maven coordinates are on `react-android`.
// Please note that the original coordinates, `react-native`, have been voided
// as they caused https://github.com/facebook/react-native/issues/35210
publishing {
  publications { getByName("release", MavenPublication::class) { artifactId = "react-android" } }
}
