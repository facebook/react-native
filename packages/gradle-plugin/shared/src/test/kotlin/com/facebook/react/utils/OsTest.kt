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
import org.assertj.core.api.Assertions.assertThat
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class OsTest {

  @get:Rule val osRule = OsRule()
  @get:Rule val tempFolder = TemporaryFolder()

  @Test
  @WithOs(OS.LINUX, "amd64")
  fun onLinuxAmd64_checksOsCorrectly() {
    assertThat(Os.isWindows()).isFalse()
    assertThat(Os.isMac()).isFalse()
    assertThat(Os.isLinuxAmd64()).isTrue()
  }

  @Test
  @WithOs(OS.MAC)
  fun onMac_checksOsCorrectly() {
    assertThat(Os.isWindows()).isFalse()
    assertThat(Os.isMac()).isTrue()
    assertThat(Os.isLinuxAmd64()).isFalse()
  }

  @Test
  @WithOs(OS.WIN)
  fun isWindows_onWindows_returnsTrue() {
    assertThat(Os.isWindows()).isTrue()
    assertThat(Os.isMac()).isFalse()
    assertThat(Os.isLinuxAmd64()).isFalse()
  }

  @Test
  fun unixifyPath_withAUnixPath_doesNothing() {
    val aUnixPath = "/just/a/unix/path.sh"

    assertThat(aUnixPath).isEqualTo(aUnixPath.unixifyPath())
  }

  @Test
  fun unixifyPath_withAWindowsPath_convertsItCorrectly() {
    val aWindowsPath = "D:\\just\\a\\windows\\path\\"

    assertThat("/D/just/a/windows/path/").isEqualTo(aWindowsPath.unixifyPath())
  }

  @Test
  @WithOs(OS.WIN)
  fun cliPath_onWindows_returnsRelativePath() {
    val tempFile = tempFolder.newFile("test.txt").apply { createNewFile() }

    assertThat(tempFile.relativeTo(tempFolder.root).path)
        .isEqualTo(tempFile.cliPath(tempFolder.root))
  }

  @Test
  @WithOs(OS.LINUX)
  fun cliPath_onLinux_returnsAbsolutePath() {
    val tempFile = tempFolder.newFile("test.txt").apply { createNewFile() }

    assertThat(tempFile.absolutePath).isEqualTo(tempFile.cliPath(tempFolder.root))
  }

  @Test
  @WithOs(OS.MAC)
  fun cliPath_onMac_returnsAbsolutePath() {
    val tempFile = tempFolder.newFile("test.txt").apply { createNewFile() }

    assertThat(tempFile.absolutePath).isEqualTo(tempFile.cliPath(tempFolder.root))
  }
}
