/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

plugins {
  id("com.facebook.react")
  alias(libs.plugins.android.application)
  alias(libs.plugins.kotlin.android)
}

val reactNativeDirPath = "$rootDir/packages/react-native"
val isNewArchEnabled = project.property("newArchEnabled") == "true"

/**
 * This is the configuration block to customize your React Native Android app. By default you don't
 * need to apply any configuration, just uncomment the lines you need.
 */
react {
  /* Folders */
  //   The root of your project, i.e. where "package.json" lives. Default is '..'
  root = file("../../")
  //   The folder where the react-native NPM package is. Default is ../node_modules/react-native
  reactNativeDir = file(reactNativeDirPath)
  //   The folder where the react-native Codegen package is. Default is
  // ../node_modules/@react-native/codegen
  codegenDir = file("$rootDir/node_modules/@react-native/codegen")
  //   The cli.js file which is the React Native CLI entrypoint. Default is
  // ../node_modules/react-native/cli.js
  cliFile = file("$reactNativeDirPath/cli.js")

  /* Variants */
  //   The list of variants to that are debuggable. For those we're going to
  //   skip the bundling of the JS bundle and the assets. By default is just 'debug'.
  //   If you add flavors like lite, prod, etc. you'll have to list your debuggableVariants.
  debuggableVariants = listOf("hermesDebug", "jscDebug")

  /* Bundling */
  //   A list containing the node command and its flags. Default is just 'node'.
  // nodeExecutableAndArgs = ["node"]
  //
  //   The command to run when bundling. By default is 'bundle'
  // bundleCommand = "ram-bundle"
  //
  //   The path to the CLI configuration file. Default is empty.
  // bundleConfig = file(../rn-cli.config.js)
  //
  //   The name of the generated asset file containing your JS bundle
  bundleAssetName = "RNTesterApp.android.bundle"
  //
  //   The entry file for bundle generation. Default is 'index.android.js' or 'index.js'
  entryFile = file("../../js/RNTesterApp.android.js")
  //
  //   A list of extra flags to pass to the 'bundle' commands.
  //   See https://github.com/react-native-community/cli/blob/main/docs/commands.md#bundle
  // extraPackagerArgs = []

  /* Hermes Commands */
  //   The hermes compiler command to run. By default it is 'hermesc'
  hermesCommand = "$reactNativeDirPath/ReactAndroid/hermes-engine/build/hermes/bin/hermesc"
  enableHermesOnlyInVariants = listOf("hermesDebug", "hermesRelease")
}

/** Run Proguard to shrink the Java bytecode in release builds. */
val enableProguardInReleaseBuilds = true

/**
 * The preferred build flavor of JavaScriptCore (JSC) For example, to use the international variant,
 * you can use: `def jscFlavor = 'org.webkit:android-jsc-intl:+'`
 */
val jscFlavor = "org.webkit:android-jsc:+"

/** This allows to customized the CMake version used for compiling RN Tester. */
val cmakeVersion =
    project(":packages:react-native:ReactAndroid").properties["cmake_version"].toString()

/** Architectures to build native code for. */
fun reactNativeArchitectures(): List<String> {
  val value = project.properties["reactNativeArchitectures"]
  return value?.toString()?.split(",") ?: listOf("armeabi-v7a", "x86", "x86_64", "arm64-v8a")
}

repositories { maven { url = rootProject.file("node_modules/jsc-android/dist").toURI() } }

android {
  compileSdk = libs.versions.compileSdk.get().toInt()
  buildToolsVersion = libs.versions.buildTools.get()
  namespace = "com.facebook.react.uiapp"

  // Used to override the NDK path/version on internal CI or by allowing
  // users to customize the NDK path/version from their root project (e.g. for Apple Silicon
  // support)
  if (rootProject.hasProperty("ndkPath") && rootProject.properties["ndkPath"] != null) {
    ndkPath = rootProject.properties["ndkPath"].toString()
  }
  if (rootProject.hasProperty("ndkVersion") && rootProject.properties["ndkVersion"] != null) {
    ndkVersion = rootProject.properties["ndkVersion"].toString()
  }

  flavorDimensions.add("vm")
  productFlavors {
    create("hermes") {
      dimension = "vm"
      buildConfigField("boolean", "IS_HERMES_ENABLED_IN_FLAVOR", "true")
    }
    create("jsc") {
      dimension = "vm"
      buildConfigField("boolean", "IS_HERMES_ENABLED_IN_FLAVOR", "false")
    }
  }

  defaultConfig {
    applicationId = "com.facebook.react.uiapp"
    minSdk = libs.versions.minSdk.get().toInt()
    targetSdk = libs.versions.targetSdk.get().toInt()
    versionCode = 1
    versionName = "1.0"
    testBuildType =
        System.getProperty(
            "testBuildType", "debug") // This will later be used to control the test apk build type
    testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    buildConfigField("String", "JS_MAIN_MODULE_NAME", "\"js/RNTesterApp.android\"")
    buildConfigField("String", "BUNDLE_ASSET_NAME", "\"RNTesterApp.android.bundle\"")
  }
  externalNativeBuild { cmake { version = cmakeVersion } }
  splits {
    abi {
      isEnable = true
      isUniversalApk = false
      reset()
      include(*reactNativeArchitectures().toTypedArray())
    }
  }
  buildTypes {
    release {
      isMinifyEnabled = enableProguardInReleaseBuilds
      proguardFiles(getDefaultProguardFile("proguard-android.txt"))
      signingConfig = signingConfigs.getByName("debug")
    }
  }
  sourceSets.named("main") {
    // SampleTurboModule.
    java.srcDirs(
        "$reactNativeDirPath/ReactCommon/react/nativemodule/samples/platform/android",
    )
  }
}

dependencies {
  // Build React Native from source
  implementation(project(":packages:react-native:ReactAndroid"))
  implementation(project(":packages:react-native-popup-menu-android:android"))

  // Consume Hermes as built from source only for the Hermes variant.
  "hermesImplementation"(project(":packages:react-native:ReactAndroid:hermes-engine"))
  "jscImplementation"(jscFlavor)

  testImplementation(libs.junit)
}

android {
  externalNativeBuild {
    cmake {
      // RN Tester is doing custom linking of C++ libraries therefore needs
      // a dedicated CMakeLists.txt file.
      if (isNewArchEnabled) {
        path("src/main/jni/CMakeLists.txt")
      }
    }
  }
}

afterEvaluate {
  if (project.findProperty("react.internal.useHermesNightly") == null ||
      project.findProperty("react.internal.useHermesNightly").toString() == "false") {
    // As we're consuming Hermes from source, we want to make sure
    // `hermesc` is built before we actually invoke the `emit*HermesResource` task
    tasks
        .getByName("createBundleHermesReleaseJsAndAssets")
        .dependsOn(":packages:react-native:ReactAndroid:hermes-engine:buildHermesC")
  }

  // As we're building 4 native flavors in parallel, there is clash on the `.cxx/Debug` and
  // `.cxx/Release` folder where the CMake intermediates are stored.
  // We fixing this by instructing Gradle to always mergeLibs after they've been built.
  if (isNewArchEnabled) {
    tasks.getByName("mergeHermesDebugNativeLibs").mustRunAfter("externalNativeBuildJscDebug")
    tasks.getByName("mergeHermesReleaseNativeLibs").mustRunAfter("externalNativeBuildJscRelease")
    tasks.getByName("mergeJscDebugNativeLibs").mustRunAfter("externalNativeBuildHermesDebug")
    tasks.getByName("mergeJscReleaseNativeLibs").mustRunAfter("externalNativeBuildHermesRelease")
  }

  // As RN-Tester consumes the codegen from source, we need to make sure the codegen exists before
  // we can actually invoke it. It's built by the ReactAndroid:buildCodegenCLI task.
  tasks
      .getByName("generateCodegenSchemaFromJavaScript")
      .dependsOn(":packages:react-native:ReactAndroid:buildCodegenCLI")
}
