/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network

/**
 * The class purpose is to weaken too strict OkHttp restriction on http headers. See:
 * https://github.com/square/okhttp/issues/2016 Auth headers might have an Authentication
 * information. It is better to get 401 from the server in this case, rather than non descriptive
 * error as 401 could be handled to invalidate the wrong token in the client code.
 */
internal class HeaderUtil {
  companion object {
    @JvmStatic
    fun stripHeaderName(name: String): String {
      val builder = StringBuilder(name.length)
      var modified = false
      for (i in 0 until name.length) {
        val c = name[i]
        if (c > '\u0020' && c < '\u007f') {
          builder.append(c)
        } else {
          modified = true
        }
      }
      return if (modified) builder.toString() else name
    }
  }
}
