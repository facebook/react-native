// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.modules.systeminfo;

import android.app.UiModeManager;
import android.content.res.Configuration;
import android.os.Build;

import com.facebook.react.bridge.ReactContext;

import java.util.Locale;

import static android.content.Context.UI_MODE_SERVICE;

public class AndroidInfoHelpers {

  public static final String EMULATOR_LOCALHOST = "10.0.2.2";
  public static final String GENYMOTION_LOCALHOST = "10.0.3.2";
  public static final String DEVICE_LOCALHOST = "localhost";

  private static final int DEBUG_SERVER_HOST_PORT = 8081;
  private static final int INSPECTOR_PROXY_PORT = 8082;

  private static boolean isRunningOnGenymotion() {
    return Build.FINGERPRINT.contains("vbox");
  }

  private static boolean isRunningOnStockEmulator() {
    return Build.FINGERPRINT.contains("generic");
  }

  public static String getServerHost() {
    return getServerIpAddress(DEBUG_SERVER_HOST_PORT);
  }

  public static String getInspectorProxyHost() {
    return getServerIpAddress(INSPECTOR_PROXY_PORT);
  }

  // WARNING(festevezga): This RN helper method has been copied to another FB-only target. Any changes should be applied to both.
  public static String getFriendlyDeviceName() {
    if (isRunningOnGenymotion()) {
      // Genymotion already has a friendly name by default
      return Build.MODEL;
    } else {
      return Build.MODEL + " - " + Build.VERSION.RELEASE + " - API " + Build.VERSION.SDK_INT;
    }
  }

  private static String getServerIpAddress(int port) {
    // Since genymotion runs in vbox it use different hostname to refer to adb host.
    // We detect whether app runs on genymotion and replace js bundle server hostname accordingly

    String ipAddress;
    if (isRunningOnGenymotion()) {
      ipAddress = GENYMOTION_LOCALHOST;
    } else if (isRunningOnStockEmulator()) {
      ipAddress = EMULATOR_LOCALHOST;
    } else {
      ipAddress = DEVICE_LOCALHOST;
    }

    return String.format(Locale.US, "%s:%d", ipAddress, port);
  }

  public static boolean isRunningOnTV(ReactContext reactContext) {
    UiModeManager uiModeManager = (UiModeManager) reactContext.getSystemService(UI_MODE_SERVICE);
    return uiModeManager.getCurrentModeType() == Configuration.UI_MODE_TYPE_TELEVISION;
  }
}
