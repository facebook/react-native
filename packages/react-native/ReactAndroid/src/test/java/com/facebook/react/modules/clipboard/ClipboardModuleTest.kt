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
import com.facebook.react.bridge.ReactApplicationContext
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
  private lateinit var mClipboardModule: ClipboardModule
  private lateinit var mClipboardManager: ClipboardManager

  @Before
  fun setUp() {
    mClipboardModule = ClipboardModule(ReactApplicationContext(RuntimeEnvironment.application))
    mClipboardManager =
      RuntimeEnvironment.application.getSystemService(Context.CLIPBOARD_SERVICE)
        as ClipboardManager
  }

  @Test
  fun testSetString() {
    mClipboardModule.setString(TEST_CONTENT)
    assertTrue(mClipboardManager.text == TEST_CONTENT)
    mClipboardModule.setString(null)
    assertFalse(mClipboardManager.hasText())
    mClipboardModule.setString("")
    assertFalse(mClipboardManager.hasText())
    mClipboardModule.setString(" ")
    assertTrue(mClipboardManager.hasText())
  }

  companion object {
    private const val TEST_CONTENT = "test"
  }
}
