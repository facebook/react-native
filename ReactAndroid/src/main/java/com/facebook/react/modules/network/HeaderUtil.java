/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.modules.network;

/**
 * The class purpose is to weaken too strict OkHttp restriction on http headers. See:
 * https://github.com/square/okhttp/issues/2016 Auth headers might have an Authentication
 * information. It is better to get 401 from the server in this case, rather than non descriptive
 * error as 401 could be handled to invalidate the wrong token in the client code.
 */
public class HeaderUtil {

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
