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
import org.assertj.core.api.Assertions.assertThat
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
    assertThat(clipboardManager.text == TEST_CONTENT).isTrue()
    clipboardModule.setString(null)
    assertThat(clipboardManager.hasText()).isFalse()
    clipboardModule.setString("")
    assertThat(clipboardManager.hasText()).isFalse()
    clipboardModule.setString(" ")
    assertThat(clipboardManager.hasText()).isTrue()
  }

  companion object {
    private const val TEST_CONTENT = "test"
  }
}
