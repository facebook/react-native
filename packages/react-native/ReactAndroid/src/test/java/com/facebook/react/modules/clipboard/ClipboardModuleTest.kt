/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.clipboard

import android.annotation.SuppressLint
import android.content.ClipboardManager
import android.content.Context
import com.facebook.react.bridge.BridgeReactContext
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@Suppress("DEPRECATION")
@SuppressLint("ClipboardManager", "DeprecatedClass")
@RunWith(RobolectricTestRunner::class)
class ClipboardModuleTest {
  private lateinit var clipboardModule: ClipboardModule
  private lateinit var clipboardManager: ClipboardManager

  @Before
  fun setUp() {
    clipboardModule = ClipboardModule(BridgeReactContext(RuntimeEnvironment.getApplication()))
    clipboardManager =
        RuntimeEnvironment.getApplication().getSystemService(Context.CLIPBOARD_SERVICE)
            as ClipboardManager
  }

  @Test
  fun testSetString() {
    clipboardModule.setString(TEST_CONTENT)
    assertTrue(clipboardManager.text == TEST_CONTENT)
    clipboardModule.setString(null)
    assertFalse(clipboardManager.hasText())
    clipboardModule.setString("")
    assertFalse(clipboardManager.hasText())
    clipboardModule.setString(" ")
    assertTrue(clipboardManager.hasText())
  }

  companion object {
    private const val TEST_CONTENT = "test"
  }
}
