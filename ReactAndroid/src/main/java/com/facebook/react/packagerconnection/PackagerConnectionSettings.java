/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.packagerconnection;

import android.content.Context;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.text.TextUtils;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers;

public class PackagerConnectionSettings {
  private static final String TAG = PackagerConnectionSettings.class.getSimpleName();
  private static final String PREFS_DEBUG_SERVER_HOST_KEY = "debug_http_host";

  private final SharedPreferences mPreferences;
  private final String mPackageName;
  private final Context mAppContext;
  private String mNonPersistentDebugServerHost = null;

  public PackagerConnectionSettings(Context applicationContext) {
    mPreferences = PreferenceManager.getDefaultSharedPreferences(applicationContext);
    mPackageName = applicationContext.getPackageName();
    mAppContext = applicationContext;
  }

  /**
   * Try to get debug server host in the order: 1. non-persistent host set by {@link
   * #setNonPersistentDebugServerHost} programmatically 2. debug setting 3. default hostname for
   * current device/emulator
   */
  public String getDebugServerHost() {
    String host = getNonPersistentDebugServerHost();
    if (!TextUtils.isEmpty(host)) {
      return host;
    }

    host = mPreferences.getString(PREFS_DEBUG_SERVER_HOST_KEY, null);
    if (!TextUtils.isEmpty(host)) {
      return host;
    }

    host = AndroidInfoHelpers.getServerHost(mAppContext);
    if (host.equals(AndroidInfoHelpers.DEVICE_LOCALHOST)) {
      FLog.w(
          TAG,
          "You seem to be running on device. Run '"
              + AndroidInfoHelpers.getAdbReverseTcpCommand(mAppContext)
              + "' "
              + "to forward the debug server's port to the device.");
    }

    return host;
  }

  public void setDebugServerHost(String host) {
    mPreferences.edit().putString(PREFS_DEBUG_SERVER_HOST_KEY, host).apply();
  }

  public synchronized String getNonPersistentDebugServerHost() {
    return mNonPersistentDebugServerHost;
  }

  public synchronized void setNonPersistentDebugServerHost(String host) {
    mNonPersistentDebugServerHost = host;
  }

  /**
   * Try to get inspector server host in the order: 1. non-persistent host set by {@link
   * #setNonPersistentDebugServerHost} programmatically 2. default hostname for current
   * device/emulator
   */
  public String getInspectorServerHost() {
    String host = getNonPersistentDebugServerHost();
    if (!TextUtils.isEmpty(host)) {
      return host;
    }

    return AndroidInfoHelpers.getInspectorProxyHost(mAppContext);
  }

  public @Nullable String getPackageName() {
    return mPackageName;
  }
}
