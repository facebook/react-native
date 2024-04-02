/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.facebook.react.utils.KotlinStdlibCompatUtils.lowercaseCompat
import java.io.File

internal object Os {

  fun isWindows(): Boolean =
      System.getProperty("os.name")?.lowercaseCompat()?.contains("windows") ?: false

  fun isMac(): Boolean = System.getProperty("os.name")?.lowercaseCompat()?.contains("mac") ?: false

  fun isLinuxAmd64(): Boolean {
    val osNameMatch = System.getProperty("os.name")?.lowercaseCompat()?.contains("linux") ?: false
    val archMatch = System.getProperty("os.arch")?.lowercaseCompat()?.contains("amd64") ?: false
    return osNameMatch && archMatch
  }

  fun String.unixifyPath() =
      this.replace('\\', '/').replace(":", "").let {
        if (!it.startsWith("/")) {
          "/$it"
        } else {
          it
        }
      }

  /**
   * As Gradle doesn't support well path with spaces on Windows, we need to return relative path on
   * Win. On Linux & Mac we'll default to return absolute path.
   */
  fun File.cliPath(base: File): String =
      if (isWindows()) {
        this.relativeTo(base).path
      } else {
        absolutePath
      }
}
