/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.devsupport

import android.os.Bundle
import android.preference.PreferenceActivity
import com.facebook.react.R
import com.facebook.react.devsupport.interfaces.DevSupportManager

/**
 * Activity that display developers settings. Should be added to the debug manifest of the app. Can
 * be triggered through the developers option menu displayed by [DevSupportManager].
 */
internal class DevSettingsActivity : PreferenceActivity() {

  @Deprecated("Deprecated in Java")
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    title = application.resources.getString(R.string.catalyst_settings_title)
    addPreferencesFromResource(R.xml.rn_dev_preferences)
  }
}
