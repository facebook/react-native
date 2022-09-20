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
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class TaskUtilsTest {

  @get:Rule val osRule = OsRule()

  @Test
  fun windowsAwareCommandLine_withEmptyInput_isEmpty() {
    assertTrue(windowsAwareCommandLine().isEmpty())
  }

  @Test
  @WithOs(OS.MAC)
  fun windowsAwareCommandLine_onMac_returnsTheList() {
    assertEquals(listOf("a", "b", "c"), windowsAwareCommandLine("a", "b", "c"))
  }

  @Test
  @WithOs(OS.LINUX)
  fun windowsAwareCommandLine_onLinux_returnsTheList() {
    assertEquals(listOf("a", "b", "c"), windowsAwareCommandLine("a", "b", "c"))
  }

  @Test
  @WithOs(OS.WIN)
  fun windowsAwareCommandLine_onWindows_prependsCmd() {
    assertEquals(listOf("cmd", "/c", "a", "b", "c"), windowsAwareCommandLine("a", "b", "c"))
  }

  @Test
  @WithOs(OS.MAC)
  fun windowsAwareBashCommandLine_onMac_returnsTheList() {
    assertEquals(
        listOf("a", "b", "c"), windowsAwareBashCommandLine("a", "b", "c", bashWindowsHome = "abc"))
  }

  @Test
  @WithOs(OS.LINUX)
  fun windowsAwareBashCommandLine_onLinux_returnsTheList() {
    assertEquals(listOf("a", "b", "c"), windowsAwareBashCommandLine("a", "b", "c"))
  }

  @Test
  @WithOs(OS.WIN)
  fun windowsAwareBashCommandLine_onWindows_prependsBash() {
    assertEquals(listOf("bash", "-c", "a", "b", "c"), windowsAwareBashCommandLine("a", "b", "c"))
  }

  @Test
  @WithOs(OS.WIN)
  fun windowsAwareBashCommandLine_onWindows_prependsCustomBashPath() {
    assertEquals(
        listOf("/custom/bash", "-c", "a", "b", "c"),
        windowsAwareBashCommandLine("a", "b", "c", bashWindowsHome = "/custom/bash"))
  }
}
