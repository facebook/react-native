/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common;

import android.net.Uri;
import android.text.TextUtils;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Tracks errors connecting to or received from the debug server. The debug server returns errors as
 * json objects. This exception represents that error.
 */
public class DebugServerException extends RuntimeException {
  private static final String GENERIC_ERROR_MESSAGE =
      "\n\nTry the following to fix the issue:\n"
          + "\u2022 Ensure that the packager server is running\n"
          + "\u2022 Ensure that your device/emulator is connected to your machine and has USB debugging enabled - run 'adb devices' to see a list of connected devices\n"
          + "\u2022 Ensure Airplane Mode is disabled\n"
          + "\u2022 If you're on a physical device connected to the same machine, run 'adb reverse tcp:<PORT> tcp:<PORT>' to forward requests from your device\n"
          + "\u2022 If your device is on the same Wi-Fi network, set 'Debug server host & port for device' in 'Dev settings' to your machine's IP address and the port of the local dev server - e.g. 10.0.1.1:<PORT>\n\n";

  public static DebugServerException makeGeneric(String url, String reason, Throwable t) {
    return makeGeneric(url, reason, "", t);
  }

  public static DebugServerException makeGeneric(
      String url, String reason, String extra, Throwable t) {
    Uri uri = Uri.parse(url);

    String message = GENERIC_ERROR_MESSAGE.replace("<PORT>", String.valueOf(uri.getPort()));

    return new DebugServerException(reason + message + extra, t);
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
   *
   * @param str json string returned by the debug server
   * @return A DebugServerException or null if the string is not of proper form.
   */
  @Nullable
  public static DebugServerException parse(String url, String str) {
    if (TextUtils.isEmpty(str)) {
      return null;
    }
    try {
      JSONObject jsonObject = new JSONObject(str);
      String fullFileName = jsonObject.getString("filename");
      return new DebugServerException(
          jsonObject.getString("message"),
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
