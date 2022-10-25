/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.android.build.api.variant.AndroidComponentsExtension
import com.facebook.react.ReactExtension
import com.facebook.react.utils.ProjectUtils.isNewArchEnabled
import java.io.File
import org.gradle.api.Project

internal object NdkConfiguratorUtils {
  @Suppress("UnstableApiUsage")
  fun configureReactNativeNdk(project: Project, extension: ReactExtension) {
    project.pluginManager.withPlugin("com.android.application") {
      project.extensions.getByType(AndroidComponentsExtension::class.java).finalizeDsl { ext ->
        if (!project.isNewArchEnabled) {
          // For Old Arch, we set a pickFirst only on libraries that we know are
          // clashing with our direct dependencies (FBJNI, Flipper and Hermes).
          ext.packagingOptions.jniLibs.pickFirsts.addAll(
              listOf(
                  "**/libfbjni.so",
                  "**/libc++_shared.so",
              ))
        } else {
          // We enable prefab so users can consume .so/headers from ReactAndroid and hermes-engine
          // .aar
          ext.buildFeatures.prefab = true

          // We set some packagingOptions { pickFirst ... } for our users for libraries we own.
          ext.packagingOptions.jniLibs.pickFirsts.addAll(
              listOf(
                  // Hermes & JSC are provided by AAR dependencies we pre-bundle.
                  "**/libhermes.so",
                  "**/libjsc.so",
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
                  "**/librrc_image.so",
                  "**/librrc_view.so",
                  "**/libruntimeexecutor.so",
                  "**/libturbomodulejsijni.so",
                  "**/libyoga.so",
                  // AGP will give priority of libc++_shared coming from App modules.
                  "**/libc++_shared.so",
              ))

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
          if ("-DGENERATED_SRC_DIR" !in cmakeArgs) {
            cmakeArgs.add("-DGENERATED_SRC_DIR=${File(project.buildDir, "generated/source")}")
          }
          if ("-DPROJECT_BUILD_DIR" !in cmakeArgs) {
            cmakeArgs.add("-DPROJECT_BUILD_DIR=${project.buildDir}")
          }
          if ("-DREACT_ANDROID_DIR" !in cmakeArgs) {
            cmakeArgs.add(
                "-DREACT_ANDROID_DIR=${extension.reactNativeDir.file("ReactAndroid").get().asFile}")
          }
          if ("-DREACT_ANDROID_BUILD_DIR" !in cmakeArgs) {
            cmakeArgs.add(
                "-DREACT_ANDROID_BUILD_DIR=${extension.reactNativeDir.file("ReactAndroid/build").get().asFile}")
          }
          if ("-DANDROID_STL" !in cmakeArgs) {
            cmakeArgs.add("-DANDROID_STL=c++_shared")
          }
        }
      }
    }
  }
}
