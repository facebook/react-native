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
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactTestHelper;
import com.facebook.react.modules.share.SimplePromise;

import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

import java.util.HashSet;

import static android.content.Context.MODE_PRIVATE;
import static org.junit.Assert.assertTrue;
import static org.mockito.Matchers.any;
import static org.mockito.Matchers.contains;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@PrepareForTest({Arguments.class})
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*", "org.json.*"})
@RunWith(RobolectricTestRunner.class)
public class SettingsModuleReadWriteTest {
  private SettingsModule mSettings;
  private SharedPreferences preferences;
  final String fileName = "test1";
  private final String mKey1 = "keyBool";
  private final boolean mVal1 = true;
  private final String mKey2 = "keyStr";
  private final String mVal2 = "testString";
  private final String mKey3 = "keyNum";
  private final float mVal3 = 555.99f;
  private final String mKey4 = "keyArr";
  private final JavaOnlyArray mVal4 = getArray("str1", "str2");

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  @Before
  public void prepareModules() {
    mSettings = new SettingsModule(ReactTestHelper.createCatalystContextForTest());
    preferences = RuntimeEnvironment.application.getSharedPreferences(fileName, MODE_PRIVATE);
    assertTrue(preferences != null);
  }

  @After
  public void cleanUp() {
    if (!preferences.getAll().isEmpty()) {
      preferences.edit().clear().commit();
      assertTrue(preferences.getAll().size() == 0);
    }
  }

  @Test
  public void testSetSettings() {
    JavaOnlyMap map = getSeedPreferences();
    mSettings.set(map, fileName);
    assertTrue(preferences.getBoolean(mKey1, false));
    assertTrue(mVal2.equals(preferences.getString(mKey2, "")));
    assertTrue(mVal3 == preferences.getFloat(mKey3, 0));
    assertTrue(preferences.getStringSet(mKey4, new HashSet<String>()).contains("str1"));
    assertTrue(preferences.getStringSet(mKey4, new HashSet<String>()).contains("str2"));
  }

  @Test
  public void testGetSettings() throws InterruptedException {
    prepareArguments();
    JavaOnlyMap map = getSeedPreferences();
    mSettings.set(map, fileName);
    SimplePromise promise = mock(SimplePromise.class);
    mSettings.get(mKey1, fileName, promise);
    verify(promise, times(1)).resolve(mVal1);
    mSettings.get(mKey2, fileName, promise);
    verify(promise, times(1)).resolve(mVal2);
    mSettings.get(mKey3, fileName, promise);
    verify(promise, times(1)).resolve(String.valueOf(mVal3));
    mSettings.get(mKey4, fileName, promise);
    verify(promise, times(1)).resolve(mVal4);
  }

  @Test
  public void testGetKeyNotFound() throws InterruptedException {
    prepareArguments();
    SimplePromise promise = mock(SimplePromise.class);
    mSettings.get(mKey1, fileName, promise);
    verify(promise, times(1)).reject(
      contains(SettingsError.KEY_NOT_FOUND.toString()),
      (Throwable) any());
  }

  @Test
  public void testGetCouldNotResolvePreferences() throws InterruptedException {
    prepareArguments();
    ReactApplicationContext context = mock(ReactApplicationContext.class);
    SettingsModule localSettings = new SettingsModule(context);
    SimplePromise promise = mock(SimplePromise.class);
    localSettings.get(mKey1, fileName, promise);
    verify(promise, times(1)).reject(
      contains(SettingsError.COULD_NOT_RESOLVE_PREFERENCES.toString()),
      (Throwable) any());
  }

  private JavaOnlyMap getSeedPreferences() {
    final JavaOnlyMap map = new JavaOnlyMap();
    map.putBoolean(mKey1, mVal1);
    map.putString(mKey2, mVal2);
    map.putDouble(mKey3, mVal3);
    map.putArray(mKey4, mVal4);
    return map;
  }

  private JavaOnlyArray getArray(String... values) {
    JavaOnlyArray array = new JavaOnlyArray();
    for (String value : values) {
      array.pushString(value);
    }
    return array;
  }

  private static void prepareArguments() {
    PowerMockito.mockStatic(Arguments.class);
    PowerMockito.when(Arguments.createArray()).thenAnswer(new Answer<Object>() {
      @Override
      public Object answer(InvocationOnMock invocation) throws Throwable {
        return new JavaOnlyArray();
      }
    });
    PowerMockito.when(Arguments.createMap()).thenAnswer(new Answer<Object>() {
      @Override
      public Object answer(InvocationOnMock invocation) throws Throwable {
        return new JavaOnlyMap();
      }
    });
  }
}
