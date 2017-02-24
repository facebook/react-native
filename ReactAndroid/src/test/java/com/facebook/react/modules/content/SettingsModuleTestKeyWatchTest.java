/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.content;

import android.content.SharedPreferences;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.ReactApplicationContext;

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;

import static org.mockito.Matchers.anyInt;
import static org.mockito.Matchers.anyString;
import static org.mockito.Matchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@PrepareForTest({Arguments.class})
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*", "org.json.*"})
@RunWith(RobolectricTestRunner.class)
public class SettingsModuleTestKeyWatchTest {
  private final String fileName = "test1";
  private SettingsModule mSettings;
  private SharedPreferences pref;
  private String mKey1 = "keyBool";
  private String mKey2 = "keyStr";
  @Rule
  public PowerMockRule rule = new PowerMockRule();

  @Before
  public void prepareModules() {
    ReactApplicationContext context = mock(ReactApplicationContext.class);
    pref = mock(SharedPreferences.class);
    when(context.getSharedPreferences(anyString(), anyInt())).thenReturn(pref);
    mSettings = new SettingsModule(context);
  }

  @Test
  public void testWatchKeys() {
    final JavaOnlyArray keys = new JavaOnlyArray();
    keys.pushString(mKey2);
    final JavaOnlyArray keysNew = new JavaOnlyArray();
    keysNew.pushString(mKey1);
    mSettings.watchKeys(keys, "0", fileName);
    mSettings.watchKeys(keysNew, "1", fileName);
    verify(pref, times(1)).registerOnSharedPreferenceChangeListener(eq(mSettings));
  }

  @Test
  public void testClearWatch() {
    final JavaOnlyArray keys = new JavaOnlyArray();
    keys.pushString(mKey2);
    final JavaOnlyArray keysNew = new JavaOnlyArray();
    keysNew.pushString(mKey1);
    mSettings.watchKeys(keys, "0", fileName);
    mSettings.watchKeys(keysNew, "1", fileName);
    mSettings.clearWatch("0");
    mSettings.clearWatch("1");
    verify(pref, times(1)).unregisterOnSharedPreferenceChangeListener(eq(mSettings));
  }
}
