/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network;

import java.lang.reflect.Method;
import okhttp3.Headers;

/**
 * The class purpose is to provide compatibility among OkHttp versions on adding non-ascii header values.
 *
 * For v3.12.0 or higher, we can use the `addUnsafeAscii` method to add non-ascii header values.
 * See: https://square.github.io/okhttp/changelogs/changelog_3x/#version-3120
 * We need to use reflection to call this method, as it is not available in older versions.
 * Remove reflection once the internal version of OkHttp is updated to v3.12.0 or higher.
 *
 * For other versions, we need to strip non-ascii header values.
 * See: https://github.com/square/okhttp/issues/2016
 * Auth headers might have an Authentication information. It is better to get 401 from the server
 * in this case, rather than non descriptive error as 401 could be handled to invalidate the wrong
 * token in the client code.
 */
public class HeaderUtil {

  public static Method addUnsafeNonAsciiMethod = null;

  static {
    try {
      addUnsafeNonAsciiMethod = Headers.Builder.class.getMethod("addUnsafeNonAscii", String.class, String.class);
    } catch (NoSuchMethodException e) {
      // Ignore
    }
  }

  public static String stripHeaderName(String name) {
    StringBuilder builder = new StringBuilder(name.length());
    boolean modified = false;
    for (int i = 0, length = name.length(); i < length; i++) {
      char c = name.charAt(i);
      if (c > '\u0020' && c < '\u007f') {
        builder.append(c);
      } else {
        modified = true;
      }
    }
    return modified ? builder.toString() : name;
  }

  public static String stripHeaderValue(String value) {
    StringBuilder builder = new StringBuilder(value.length());
    boolean modified = false;
    for (int i = 0, length = value.length(); i < length; i++) {
      char c = value.charAt(i);
      if ((c > '\u001f' && c < '\u007f') || c == '\t') {
        builder.append(c);
      } else {
        modified = true;
      }
    }
    return modified ? builder.toString() : value;
  }
}
