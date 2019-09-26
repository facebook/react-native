/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.clipboard;

import android.annotation.SuppressLint;
import android.content.Context;
import android.text.ClipboardManager;

import com.facebook.react.bridge.ReactTestHelper;
import com.facebook.react.modules.clipboard.ClipboardModule;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

import static org.junit.Assert.assertTrue;
import static org.junit.Assert.assertFalse;

@SuppressLint({"ClipboardManager", "DeprecatedClass"})
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
public class ClipboardModuleTest {

  private static final String TEST_CONTENT = "test";

  private ClipboardModule mClipboardModule;
  private ClipboardManager mClipboardManager;

  @Before
  public void setUp() {
    mClipboardModule = new ClipboardModule(RuntimeEnvironment.application);
    mClipboardManager =
        (ClipboardManager) RuntimeEnvironment.application.getSystemService(Context.CLIPBOARD_SERVICE);
  }

  @Test
  public void testSetString() {
    mClipboardModule.setString(TEST_CONTENT);
    assertTrue(mClipboardManager.getText().equals(TEST_CONTENT));

    mClipboardModule.setString(null);
    assertFalse(mClipboardManager.hasText());

    mClipboardModule.setString("");
    assertFalse(mClipboardManager.hasText());

    mClipboardModule.setString(" ");
    assertTrue(mClipboardManager.hasText());
  }
}
