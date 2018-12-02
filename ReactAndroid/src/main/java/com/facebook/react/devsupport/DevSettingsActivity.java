/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import android.os.Bundle;
import android.preference.PreferenceActivity;

import com.facebook.react.R;
import com.facebook.react.common.DebugServerException;

/**
 * Activity that display developers settings. Should be added to the debug manifest of the app. Can
 * be triggered through the developers option menu displayed by {@link DevSupportManager}.
 */
public class DevSettingsActivity extends PreferenceActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setTitle(getApplication().getResources().getString(R.string.catalyst_settings_title));
    addPreferencesFromResource(R.xml.preferences);
  }
}
