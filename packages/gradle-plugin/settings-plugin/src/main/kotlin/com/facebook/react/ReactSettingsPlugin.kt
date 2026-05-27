/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import org.gradle.api.Plugin
import org.gradle.api.initialization.Settings

/**
 * This is the settings.gradle plugin for React Native.
 *
 * It just registers the [ReactSettingsExtension] extension, so that utility functions over there
 * can be called to support autolinking.
 */
class ReactSettingsPlugin : Plugin<Settings> {
  override fun apply(settings: Settings) {
    settings.extensions.create("reactSettings", ReactSettingsExtension::class.java, settings)
  }
}
