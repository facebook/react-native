/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.i18nmanager;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import androidx.annotation.Nullable;
import androidx.core.text.TextUtilsCompat;
import androidx.core.util.Preconditions;
import androidx.core.view.ViewCompat;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Nullsafe;
import java.lang.reflect.Method;
import java.util.Locale;

@Nullsafe(Nullsafe.Mode.LOCAL)
public class I18nUtil {
  private static @Nullable I18nUtil sharedI18nUtilInstance = null;

  private static final String TAG = "I18nUtil";
  private static final String SHARED_PREFS_NAME = "com.facebook.react.modules.i18nmanager.I18nUtil";
  private static final String KEY_FOR_PREFS_ALLOWRTL = "RCTI18nUtil_allowRTL";
  private static final String KEY_FOR_PREFS_FORCERTL = "RCTI18nUtil_forceRTL";
  private static final String KEY_FOR_PERFS_MAKE_RTL_FLIP_LEFT_AND_RIGHT_STYLES =
      "RCTI18nUtil_makeRTLFlipLeftAndRightStyles";

  private boolean mHasCheckedRtlSupport = false;
  private boolean mHasRtlSupport = true;

  private I18nUtil() {
    // Exists only to defeat instantiation.
  }

  public static I18nUtil getInstance() {
    if (sharedI18nUtilInstance == null) {
      sharedI18nUtilInstance = new I18nUtil();
    }
    return sharedI18nUtilInstance;
  }

  /**
   * Check if the device is currently running on an RTL locale. This only happens when the app:
   *
   * <ul>
   *   <li>is forcing RTL layout, regardless of the active language (for development purpose)
   *   <li>allows RTL layout when using RTL locale
   * </ul>
   */
  public boolean isRTL(Context context) {
    if (!applicationHasRtlSupport(context)) {
      return false;
    }

    if (isRTLForced(context)) {
      return true;
    }

    return isRTLAllowed(context) && isDevicePreferredLanguageRTL();
  }

  /**
   * Android relies on the presence of `android:supportsRtl="true"` being set in order to resolve
   * RTL as a layout direction for native Android views. RTL in React Native relies on this being
   * set.
   */
  private boolean applicationHasRtlSupport(Context context) {
    if (!mHasCheckedRtlSupport) {
      mHasCheckedRtlSupport = true;
      ApplicationInfo applicationInfo = context.getApplicationInfo();
      try {
        Method hasRtlSupport = ApplicationInfo.class.getMethod("hasRtlSupport");
        mHasRtlSupport =
            Preconditions.checkNotNull((Boolean) hasRtlSupport.invoke(applicationInfo));
      } catch (ReflectiveOperationException e) {
        FLog.w(TAG, "Failed to check if application has RTL support");
      }
    }
    return mHasRtlSupport;
  }

  /**
   * Should be used very early during app start up Before the bridge is initialized
   *
   * @return whether the app allows RTL layout, default is true
   */
  private boolean isRTLAllowed(Context context) {
    // We should only claim to allow RTL if `android:supportsRtl="true"` is set, otherwise the
    // platform apart from Yoga ignores layout direction.
    return applicationHasRtlSupport(context) && isPrefSet(context, KEY_FOR_PREFS_ALLOWRTL, true);
  }

  public void allowRTL(Context context, boolean allowRTL) {
    setPref(context, KEY_FOR_PREFS_ALLOWRTL, allowRTL);
  }

  public boolean doLeftAndRightSwapInRTL(Context context) {
    return isPrefSet(context, KEY_FOR_PERFS_MAKE_RTL_FLIP_LEFT_AND_RIGHT_STYLES, true);
  }

  public void swapLeftAndRightInRTL(Context context, boolean flip) {
    setPref(context, KEY_FOR_PERFS_MAKE_RTL_FLIP_LEFT_AND_RIGHT_STYLES, flip);
  }

  /** Could be used to test RTL layout with English Used for development and testing purpose */
  private boolean isRTLForced(Context context) {
    return isPrefSet(context, KEY_FOR_PREFS_FORCERTL, false);
  }

  public void forceRTL(Context context, boolean forceRTL) {
    setPref(context, KEY_FOR_PREFS_FORCERTL, forceRTL);
  }

  // Check if the current device language is RTL
  private boolean isDevicePreferredLanguageRTL() {
    final int directionality = TextUtilsCompat.getLayoutDirectionFromLocale(Locale.getDefault());
    return directionality == ViewCompat.LAYOUT_DIRECTION_RTL;
  }

  private boolean isPrefSet(Context context, String key, boolean defaultValue) {
    SharedPreferences prefs = context.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE);
    return prefs.getBoolean(key, defaultValue);
  }

  private void setPref(Context context, String key, boolean value) {
    SharedPreferences.Editor editor =
        context.getSharedPreferences(SHARED_PREFS_NAME, Context.MODE_PRIVATE).edit();
    editor.putBoolean(key, value);
    editor.apply();
  }
}
