/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.devsupport;

import javax.annotation.Nullable;

import java.io.IOException;

import android.text.TextUtils;

import com.facebook.common.logging.FLog;
import com.facebook.react.common.ReactConstants;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * The debug server returns errors as json objects. This exception represents that error.
 */
public class DebugServerException extends IOException {

  public final String description;
  public final String fileName;
  public final int lineNumber;
  public final int column;

  private DebugServerException(String description, String fileName, int lineNumber, int column) {
    this.description = description;
    this.fileName = fileName;
    this.lineNumber = lineNumber;
    this.column = column;
  }

  public String toReadableMessage() {
    return description + "\n  at " + fileName + ":" + lineNumber + ":" + column;
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
