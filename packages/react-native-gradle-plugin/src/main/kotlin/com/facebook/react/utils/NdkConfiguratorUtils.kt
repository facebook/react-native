/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.android.build.api.variant.AndroidComponentsExtension
import com.android.build.api.variant.Variant
import com.facebook.react.ReactExtension
import com.facebook.react.utils.ProjectUtils.getReactNativeArchitectures
import com.facebook.react.utils.ProjectUtils.isNewArchEnabled
import java.io.File
import org.gradle.api.Project

internal object NdkConfiguratorUtils {
  @Suppress("UnstableApiUsage")
  fun configureReactNativeNdk(project: Project, extension: ReactExtension) {
    project.pluginManager.withPlugin("com.android.application") {
      project.extensions.getByType(AndroidComponentsExtension::class.java).finalizeDsl { ext ->
        if (!project.isNewArchEnabled(extension)) {
          // For Old Arch, we don't need to setup the NDK
          return@finalizeDsl
        }
        // We enable prefab so users can consume .so/headers from ReactAndroid and hermes-engine
        // .aar
        ext.buildFeatures.prefab = true

        // If the user has not provided a CmakeLists.txt path, let's provide
        // the default one from the framework
        if (ext.externalNativeBuild.cmake.path == null) {
          ext.externalNativeBuild.cmake.path =
              File(
                  extension.reactNativeDir.get().asFile,
                  "ReactAndroid/cmake-utils/default-app-setup/CMakeLists.txt")
        }

        // Parameters should be provided in an additive manner (do not override what
        // the user provided, but allow for sensible defaults).
        val cmakeArgs = ext.defaultConfig.externalNativeBuild.cmake.arguments
        if (cmakeArgs.none { it.startsWith("-DPROJECT_BUILD_DIR") }) {
          cmakeArgs.add("-DPROJECT_BUILD_DIR=${project.layout.buildDirectory.get().asFile}")
        }
        if (cmakeArgs.none { it.startsWith("-DREACT_ANDROID_DIR") }) {
          cmakeArgs.add(
              "-DREACT_ANDROID_DIR=${extension.reactNativeDir.file("ReactAndroid").get().asFile}")
        }
        if (cmakeArgs.none { it.startsWith("-DANDROID_STL") }) {
          cmakeArgs.add("-DANDROID_STL=c++_shared")
        }
        // Due to the new NDK toolchain file, the C++ flags gets overridden between compilation
        // units. This is causing some libraries to don't be compiled with -DANDROID and other
        // crucial flags. This can be revisited once we bump to NDK 25/26
        if (cmakeArgs.none { it.startsWith("-DANDROID_USE_LEGACY_TOOLCHAIN_FILE") }) {
          cmakeArgs.add("-DANDROID_USE_LEGACY_TOOLCHAIN_FILE=ON")
        }

        val architectures = project.getReactNativeArchitectures()
        // abiFilters are split ABI are not compatible each other, so we set the abiFilters
        // only if the user hasn't enabled the split abi feature.
        if (architectures.isNotEmpty() && !ext.splits.abi.isEnable) {
          ext.defaultConfig.ndk.abiFilters.addAll(architectures)
        }
      }
    }
  }

  /**
   * This method is used to configure the .so Packaging Options for the given variant. It will make
   * sure we specify the correct .pickFirsts for all the .so files we are producing or that we're
   * aware of as some of our dependencies are pulling them in.
   */
  fun configureNewArchPackagingOptions(
      project: Project,
      extension: ReactExtension,
      variant: Variant
  ) {
    if (!project.isNewArchEnabled(extension)) {
      // For Old Arch, we set a pickFirst only on libraries that we know are
      // clashing with our direct dependencies (mainly FBJNI and Hermes).
      variant.packaging.jniLibs.pickFirsts.addAll(
          listOf(
              "**/libfbjni.so",
              "**/libc++_shared.so",
          ))
    } else {
      // We set some packagingOptions { pickFirst ... } for our users for libraries we own.
      variant.packaging.jniLibs.pickFirsts.addAll(
          listOf(
              // This is the .so provided by FBJNI via prefab
              "**/libfbjni.so",
              // Those are prefab libraries we distribute via ReactAndroid
              // Due to a bug in AGP, they fire a warning on console as both the JNI
              // and the prefab .so files gets considered. See more on:
              "**/libfabricjni.so",
              "**/libfolly_runtime.so",
              "**/libglog.so",
              "**/libjsi.so",
              "**/libreact_codegen_rncore.so",
              "**/libreact_debug.so",
              "**/libreact_nativemodule_core.so",
              "**/libreact_newarchdefaults.so",
              "**/libreact_render_componentregistry.so",
              "**/libreact_render_core.so",
              "**/libreact_render_debug.so",
              "**/libreact_render_graphics.so",
              "**/libreact_render_imagemanager.so",
              "**/libreact_render_mapbuffer.so",
              "**/libreact_utils.so",
              "**/librrc_image.so",
              "**/librrc_legacyviewmanagerinterop.so",
              "**/librrc_view.so",
              "**/libruntimeexecutor.so",
              "**/libturbomodulejsijni.so",
              "**/libyoga.so",
              // AGP will give priority of libc++_shared coming from App modules.
              "**/libc++_shared.so",
          ))
    }
  }

  /**
   * This method is used to configure the .so Cleanup for the given variant. It takes care of
   * cleaning up the .so files that are not needed for Hermes or JSC, given a specific variant.
   */
  fun configureJsEnginePackagingOptions(
      config: ReactExtension,
      variant: Variant,
      hermesEnabled: Boolean,
  ) {
    if (config.enableSoCleanup.get()) {
      val (excludes, includes) = getPackagingOptionsForVariant(hermesEnabled)
      variant.packaging.jniLibs.excludes.addAll(excludes)
      variant.packaging.jniLibs.pickFirsts.addAll(includes)
    }
  }

  fun getPackagingOptionsForVariant(hermesEnabled: Boolean): Pair<List<String>, List<String>> {
    val excludes = mutableListOf<String>()
    val includes = mutableListOf<String>()
    if (hermesEnabled) {
      excludes.add("**/libjsc.so")
      excludes.add("**/libjscexecutor.so")
      includes.add("**/libhermes.so")
      includes.add("**/libhermes_executor.so")
    } else {
      excludes.add("**/libhermes.so")
      excludes.add("**/libhermes_executor.so")
      includes.add("**/libjsc.so")
      includes.add("**/libjscexecutor.so")
    }
    return excludes to includes
  }
}
