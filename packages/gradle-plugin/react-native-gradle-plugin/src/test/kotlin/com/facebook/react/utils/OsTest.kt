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
import com.facebook.react.utils.Os.cliPath
import com.facebook.react.utils.Os.unixifyPath
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class OsTest {

  @get:Rule val osRule = OsRule()
  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  @WithOs(OS.LINUX, "amd64")
  fun onLinuxAmd64_checksOsCorrectly() {
    assertFalse(Os.isWindows())
    assertFalse(Os.isMac())
    assertTrue(Os.isLinuxAmd64())
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

  @Test
  @WithOs(OS.WIN)
  fun cliPath_onWindows_returnsRelativePath() {
    val tempFile = tempFolder.newFile("test.txt").apply { createNewFile() }

    assertEquals(tempFile.relativeTo(tempFolder.root).path, tempFile.cliPath(tempFolder.root))
  }

  @Test
  @WithOs(OS.LINUX)
  fun cliPath_onLinux_returnsAbsolutePath() {
    val tempFile = tempFolder.newFile("test.txt").apply { createNewFile() }

    assertEquals(tempFile.absolutePath, tempFile.cliPath(tempFolder.root))
  }

  @Test
  @WithOs(OS.MAC)
  fun cliPath_onMac_returnsAbsolutePath() {
    val tempFile = tempFolder.newFile("test.txt").apply { createNewFile() }

    assertEquals(tempFile.absolutePath, tempFile.cliPath(tempFolder.root))
  }
}
