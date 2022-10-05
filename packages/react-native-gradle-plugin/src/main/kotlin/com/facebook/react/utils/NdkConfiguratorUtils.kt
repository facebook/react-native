/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.android.build.api.variant.AndroidComponentsExtension
import com.facebook.react.utils.ProjectUtils.isNewArchEnabled
import org.gradle.api.Project

internal object NdkConfiguratorUtils {
  @Suppress("UnstableApiUsage")
  fun configureReactNativePrefab(project: Project) {
    if (!project.isNewArchEnabled) {
      return
    }
    project.pluginManager.withPlugin("com.android.application") {
      project.extensions.getByType(AndroidComponentsExtension::class.java).finalizeDsl { ext ->
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
                "**/libreact_render_mapbuffer.so",
                "**/librrc_view.so",
                "**/libruntimeexecutor.so",
                "**/libturbomodulejsijni.so",
                "**/libyoga.so",
                // AGP will give priority of libc++_shared coming from App modules.
                "**/libc++_shared.so",
            ))
      }
    }
  }
}
