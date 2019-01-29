/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common;

import javax.annotation.Nullable;

import java.io.IOException;

import android.text.TextUtils;

import com.facebook.common.logging.FLog;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * Tracks errors connecting to or received from the debug server.
 * The debug server returns errors as json objects. This exception represents that error.
 */
public class DebugServerException extends RuntimeException {
  private static final String GENERIC_ERROR_MESSAGE =
      "\n\nTry the following to fix the issue:\n" +
      "\u2022 Ensure that the packager server is running\n" +
      "\u2022 Ensure that your device/emulator is connected to your machine and has USB debugging enabled - run 'adb devices' to see a list of connected devices\n" +
      "\u2022 Ensure Airplane Mode is disabled\n" +
      "\u2022 If you're on a physical device connected to the same machine, run 'adb reverse tcp:8081 tcp:8081' to forward requests from your device\n" +
      "\u2022 If your device is on the same Wi-Fi network, set 'Debug server host & port for device' in 'Dev settings' to your machine's IP address and the port of the local dev server - e.g. 10.0.1.1:8081\n\n";

  public static DebugServerException makeGeneric(String reason, Throwable t) {
    return makeGeneric(reason, "", t);
  }

  public static DebugServerException makeGeneric(String reason, String extra, Throwable t) {
    return new DebugServerException(reason + GENERIC_ERROR_MESSAGE + extra, t);
  }

  private DebugServerException(String description, String fileName, int lineNumber, int column) {
    super(description + "\n  at " + fileName + ":" + lineNumber + ":" + column);
  }

  public DebugServerException(String description) {
    super(description);
  }

  public DebugServerException(String detailMessage, Throwable throwable) {
    super(detailMessage, throwable);
  }

  /**
   * Parse a DebugServerException from the server json string.
   * @param str json string returned by the debug server
   * @return A DebugServerException or null if the string is not of proper form.
   */
  @Nullable public static DebugServerException parse(String str) {
    if (TextUtils.isEmpty(str)) {
      return null;
    }
    try {
      JSONObject jsonObject = new JSONObject(str);
      String fullFileName = jsonObject.getString("filename");
      return new DebugServerException(
          jsonObject.getString("description"),
          shortenFileName(fullFileName),
          jsonObject.getInt("lineNumber"),
          jsonObject.getInt("column"));
    } catch (JSONException e) {
      // I'm not sure how strict this format is for returned errors, or what other errors there can
      // be, so this may end up being spammy. Can remove it later if necessary.
      FLog.w(ReactConstants.TAG, "Could not parse DebugServerException from: " + str, e);
      return null;
    }
  }

  private static String shortenFileName(String fullFileName) {
    String[] parts = fullFileName.split("/");
    return parts[parts.length - 1];
  }
}
