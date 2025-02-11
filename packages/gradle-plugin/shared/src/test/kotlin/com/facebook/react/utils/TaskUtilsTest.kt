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
import org.assertj.core.api.Assertions.assertThat
import org.junit.Rule
import org.junit.Test

class TaskUtilsTest {

  @get:Rule val osRule = OsRule()

  @Test
  fun windowsAwareCommandLine_withEmptyInput_isEmpty() {
    assertThat(windowsAwareCommandLine().isEmpty()).isTrue()
  }

  @Test
  fun windowsAwareCommandLine_withList_isEqualAsVararg() {
    assertThat(windowsAwareCommandLine(listOf("a", "b", "c")))
        .isEqualTo(windowsAwareCommandLine("a", "b", "c"))
  }

  @Test
  @WithOs(OS.MAC)
  fun windowsAwareCommandLine_onMac_returnsTheList() {
    assertThat(listOf("a", "b", "c")).isEqualTo(windowsAwareCommandLine("a", "b", "c"))
  }

  @Test
  @WithOs(OS.LINUX)
  fun windowsAwareCommandLine_onLinux_returnsTheList() {
    assertThat(listOf("a", "b", "c")).isEqualTo(windowsAwareCommandLine("a", "b", "c"))
  }

  @Test
  @WithOs(OS.WIN)
  fun windowsAwareCommandLine_onWindows_prependsCmd() {
    assertThat(listOf("cmd", "/c", "a", "b", "c")).isEqualTo(windowsAwareCommandLine("a", "b", "c"))
  }

  @Test
  @WithOs(OS.MAC)
  fun windowsAwareBashCommandLine_onMac_returnsTheList() {
    assertThat(listOf("a", "b", "c"))
        .isEqualTo(windowsAwareBashCommandLine("a", "b", "c", bashWindowsHome = "abc"))
  }

  @Test
  @WithOs(OS.LINUX)
  fun windowsAwareBashCommandLine_onLinux_returnsTheList() {
    assertThat(listOf("a", "b", "c")).isEqualTo(windowsAwareBashCommandLine("a", "b", "c"))
  }

  @Test
  @WithOs(OS.WIN)
  fun windowsAwareBashCommandLine_onWindows_prependsBash() {
    assertThat(listOf("bash", "-c", "a", "b", "c"))
        .isEqualTo(windowsAwareBashCommandLine("a", "b", "c"))
  }

  @Test
  @WithOs(OS.WIN)
  fun windowsAwareBashCommandLine_onWindows_prependsCustomBashPath() {
    assertThat(listOf("/custom/bash", "-c", "a", "b", "c"))
        .isEqualTo(windowsAwareBashCommandLine("a", "b", "c", bashWindowsHome = "/custom/bash"))
  }
}
