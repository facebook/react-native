/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.facebook.react.tests.OS
import com.facebook.react.tests.OsRule
import com.facebook.react.tests.WithOs
import com.facebook.react.utils.Os.unixifyPath
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class OsTest {

  @get:Rule val osRule = OsRule()

  @Test
  @WithOs(OS.UNIX)
  fun onUnix_checksOsCorrectly() {
    assertFalse(Os.isWindows())
    assertFalse(Os.isMac())
    assertFalse(Os.isLinuxAmd64())
  }

  @Test
  @WithOs(OS.MAC)
  fun onMac_checksOsCorrectly() {
    assertFalse(Os.isWindows())
    assertTrue(Os.isMac())
    assertFalse(Os.isLinuxAmd64())
  }

  @Test
  @WithOs(OS.WIN)
  fun isWindows_onWindows_returnsTrue() {
    assertTrue(Os.isWindows())
    assertFalse(Os.isMac())
    assertFalse(Os.isLinuxAmd64())
  }

  @Test
  fun unixifyPath_withAUnixPath_doesNothing() {
    val aUnixPath = "/just/a/unix/path.sh"

    assertEquals(aUnixPath, aUnixPath.unixifyPath())
  }

  @Test
  fun unixifyPath_withAWindowsPath_convertsItCorrectly() {
    val aWindowsPath = "D:\\just\\a\\windows\\path\\"

    assertEquals("/D/just/a/windows/path/", aWindowsPath.unixifyPath())
  }
}
