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
 * This is a stub of the com.facebook.react.settings plugin.
 * 
 * The plugin got added in 0.75, but to make it easier for 0.74 users to upgrade to 0.75, we're
 * creating a stub plugin that does nothing. This way, users can include a `id("com.facebook.react.settings")`
 * in their settings.gradle file without causing a build failure on 0.74.
 */
class ReactSettingsPlugin : Plugin<Settings> {
  override fun apply(settings: Settings) {
    // Do nothing, just register the plugin.
  }
}