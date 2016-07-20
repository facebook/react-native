/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.i18nmanager;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;

public class I18nUtil {
  private static I18nUtil sharedI18nUtilInstance = null;

  private static final String MY_PREFS_NAME =
    "com.facebook.react.modules.i18nmanager.I18nUtil";
  private static final String KEY_FOR_PREFS =
    "RCTI18nUtil_allowRTL";

  private I18nUtil() {
     // Exists only to defeat instantiation.
  }

  public static I18nUtil getInstance() {
    if(sharedI18nUtilInstance == null) {
      sharedI18nUtilInstance = new I18nUtil();
    }
    return sharedI18nUtilInstance;
  }

  // If set allowRTL on the JS side,
  // the RN app will automatically have a RTL layout.
  public boolean isRTL(Context context) {
    return allowRTL(context);
  }

  private boolean allowRTL(Context context) {
    SharedPreferences prefs =
      context.getSharedPreferences(MY_PREFS_NAME, Context.MODE_PRIVATE);
    return prefs.getBoolean(KEY_FOR_PREFS, false);
  }

  public void setAllowRTL(Context context, boolean allowRTL) {
    SharedPreferences.Editor editor =
      context.getSharedPreferences(MY_PREFS_NAME, Context.MODE_PRIVATE).edit();
    editor.putBoolean(KEY_FOR_PREFS, allowRTL);
    editor.apply();
  }
}
