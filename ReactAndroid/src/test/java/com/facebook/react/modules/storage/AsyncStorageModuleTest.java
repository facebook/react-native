/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.modules.storage;

import static org.fest.assertions.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.JavaOnlyMap;
import com.facebook.react.bridge.ReactTestHelper;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.mockito.verification.VerificationMode;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.util.concurrent.RoboExecutorService;

/** Tests for {@link com.facebook.react.modules.storage.AsyncStorageModule}. */
@PrepareForTest({Arguments.class})
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*", "org.json.*"})
@RunWith(RobolectricTestRunner.class)
public class AsyncStorageModuleTest {

  private AsyncStorageModule mStorage;
  private JavaOnlyArray mEmptyArray;

  @Rule public PowerMockRule rule = new PowerMockRule();

  @Before
  public void prepareModules() {
    PowerMockito.mockStatic(Arguments.class);
    Mockito.when(Arguments.createArray())
        .thenAnswer(
            new Answer<Object>() {
              @Override
              public Object answer(InvocationOnMock invocation) throws Throwable {
                return new JavaOnlyArray();
              }
            });

    Mockito.when(Arguments.createMap())
        .thenAnswer(
            new Answer<Object>() {
              @Override
              public Object answer(InvocationOnMock invocation) throws Throwable {
                return new JavaOnlyMap();
              }
            });

    // don't use Robolectric before initializing mocks
    mStorage =
        new AsyncStorageModule(
            ReactTestHelper.createCatalystContextForTest(), new RoboExecutorService());
    mEmptyArray = new JavaOnlyArray();
  }

  @After
  public void cleanUp() {
    // RuntimeEnvironment.application.deleteDatabase(ReactDatabaseSupplier.DATABASE_NAME);
    ReactDatabaseSupplier.deleteInstance();
  }

  @Test
  public void testMultiSetMultiGet() {
    final String key1 = "foo1";
    final String key2 = "foo2";
    final String fakeKey = "fakeKey";
    final String value1 = "bar1";
    final String value2 = "bar2";
    JavaOnlyArray keyValues = new JavaOnlyArray();
    keyValues.pushArray(getArray(key1, value1));
    keyValues.pushArray(getArray(key2, value2));

    Callback setCallback = mock(Callback.class);
    mStorage.multiSet(keyValues, setCallback);
    verify(setCallback, Mockito.times(1)).invoke();

    JavaOnlyArray keys = new JavaOnlyArray();
    keys.pushString(key1);
    keys.pushString(key2);

    Callback getCallback = mock(Callback.class);
    mStorage.multiGet(keys, getCallback);
    verify(getCallback, Mockito.times(1)).invoke(null, keyValues);

    keys.pushString(fakeKey);
    JavaOnlyArray row3 = new JavaOnlyArray();
    row3.pushString(fakeKey);
    row3.pushString(null);
    keyValues.pushArray(row3);

    Callback getCallback2 = mock(Callback.class);
    mStorage.multiGet(keys, getCallback2);
    verify(getCallback2, Mockito.times(1)).invoke(null, keyValues);
  }

  @Test
  public void testMultiRemove() {
    final String key1 = "foo1";
    final String key2 = "foo2";
    final String value1 = "bar1";
    final String value2 = "bar2";

    JavaOnlyArray keyValues = new JavaOnlyArray();
    keyValues.pushArray(getArray(key1, value1));
    keyValues.pushArray(getArray(key2, value2));
    mStorage.multiSet(keyValues, mock(Callback.class));

    JavaOnlyArray keys = new JavaOnlyArray();
    keys.pushString(key1);
    keys.pushString(key2);

    Callback getCallback = mock(Callback.class);
    mStorage.multiRemove(keys, getCallback);
    verify(getCallback, Mockito.times(1)).invoke();

    Callback getAllCallback = mock(Callback.class);
    mStorage.getAllKeys(getAllCallback);
    verify(getAllCallback, Mockito.times(1)).invoke(null, mEmptyArray);

    mStorage.multiSet(keyValues, mock(Callback.class));

    keys.pushString("fakeKey");
    Callback getCallback2 = mock(Callback.class);
    mStorage.multiRemove(keys, getCallback2);
    verify(getCallback2, Mockito.times(1)).invoke();

    Callback getAllCallback2 = mock(Callback.class);
    mStorage.getAllKeys(getAllCallback2);
    verify(getAllCallback2, Mockito.times(1)).invoke(null, mEmptyArray);
  }

  @Test
  public void testMultiMerge() throws Exception {
    final String mergeKey = "mergeTest";

    JSONObject value = new JSONObject();
    value.put("foo1", "bar1");
    value.put("foo2", createJSONArray("val1", "val2", 3));
    value.put("foo3", 1001);
    value.put("foo4", createJSONObject("key1", "randomValueThatWillNeverBeUsed"));

    mStorage.multiSet(JavaOnlyArray.of(getArray(mergeKey, value.toString())), mock(Callback.class));
    {
      Callback callback = mock(Callback.class);
      mStorage.multiGet(getArray(mergeKey), callback);
      verify(callback, Mockito.times(1))
          .invoke(null, JavaOnlyArray.of(getArray(mergeKey, value.toString())));
    }

    value.put("foo1", 1001);
    value.put("foo2", createJSONObject("key1", "val1"));
    value.put("foo3", "bar1");
    value.put("foo4", createJSONArray("val1", "val2", 3));

    JSONObject newValue = new JSONObject();
    newValue.put("foo2", createJSONObject("key2", "val2"));

    JSONObject newValue2 = new JSONObject();
    newValue2.put("foo2", createJSONObject("key1", "val3"));

    mStorage.multiMerge(
        JavaOnlyArray.of(
            JavaOnlyArray.of(mergeKey, value.toString()),
            JavaOnlyArray.of(mergeKey, newValue.toString()),
            JavaOnlyArray.of(mergeKey, newValue2.toString())),
        mock(Callback.class));

    value.put("foo2", createJSONObject("key1", "val3", "key2", "val2"));
    Callback callback = mock(Callback.class);
    mStorage.multiGet(getArray(mergeKey), callback);
    verify(callback, Mockito.times(1))
        .invoke(null, JavaOnlyArray.of(getArray(mergeKey, value.toString())));
  }

  @Test
  public void testGetAllKeys() {
    final String[] keys = {"foo", "foo2"};
    final String[] values = {"bar", "bar2"};
    JavaOnlyArray keyValues = new JavaOnlyArray();
    keyValues.pushArray(getArray(keys[0], values[0]));
    keyValues.pushArray(getArray(keys[1], values[1]));
    mStorage.multiSet(keyValues, mock(Callback.class));

    JavaOnlyArray storedKeys = new JavaOnlyArray();
    storedKeys.pushString(keys[0]);
    storedKeys.pushString(keys[1]);

    Callback getAllCallback = mock(Callback.class);
    mStorage.getAllKeys(getAllCallback);
    verify(getAllCallback, Mockito.times(1)).invoke(null, storedKeys);

    Callback getAllCallback2 = mock(Callback.class);
    mStorage.multiRemove(getArray(keys[0]), mock(Callback.class));

    mStorage.getAllKeys(getAllCallback2);
    verify(getAllCallback2, Mockito.times(1)).invoke(null, getArray(keys[1]));

    mStorage.multiRemove(getArray(keys[1]), mock(Callback.class));
    Callback getAllCallback3 = mock(Callback.class);
    mStorage.getAllKeys(getAllCallback3);
    verify(getAllCallback3, Mockito.times(1)).invoke(null, mEmptyArray);
  }

  @Test
  public void testClear() {
    JavaOnlyArray keyValues = new JavaOnlyArray();
    keyValues.pushArray(getArray("foo", "foo2"));
    keyValues.pushArray(getArray("bar", "bar2"));
    mStorage.multiSet(keyValues, mock(Callback.class));

    Callback clearCallback2 = mock(Callback.class);
    mStorage.clear(clearCallback2);
    verify(clearCallback2, Mockito.times(1)).invoke();

    Callback getAllCallback2 = mock(Callback.class);
    mStorage.getAllKeys(getAllCallback2);
    verify(getAllCallback2, Mockito.times(1)).invoke(null, mEmptyArray);
  }

  @Test
  public void testHugeMultiGetMultiGet() {
    // Test with many keys, so that it's above the 999 limit per batch imposed by SQLite.
    final int keyCount = 1001;
    // don't set keys that divide by this magical number, so that we can check that multiGet works,
    // and returns null for missing keys
    final int magicalNumber = 343;

    JavaOnlyArray keyValues = new JavaOnlyArray();
    for (int i = 0; i < keyCount; i++) {
      if (i % magicalNumber > 0) {
        keyValues.pushArray(getArray("key" + i, "value" + i));
      }
    }
    mStorage.multiSet(keyValues, mock(Callback.class));
    JavaOnlyArray keys = new JavaOnlyArray();
    for (int i = 0; i < keyCount; i++) {
      keys.pushString("key" + i);
    }
    mStorage.multiGet(
        keys,
        new Callback() {
          @Override
          public void invoke(Object... args) {
            assertThat(args.length).isEqualTo(2);
            JavaOnlyArray resultArray = (JavaOnlyArray) args[1];

            assertThat(resultArray.size()).isEqualTo(keyCount);
            boolean keyReceived[] = new boolean[keyCount];
            for (int i = 0; i < keyCount; i++) {
              String key = resultArray.getArray(i).getString(0).substring(3);
              int idx = Integer.parseInt(key);
              assertThat(keyReceived[idx]).isFalse();
              keyReceived[idx] = true;

              if (idx % magicalNumber > 0) {
                String value = resultArray.getArray(i).getString(1).substring(5);
                assertThat(key).isEqualTo(value);
              } else {
                assertThat(resultArray.getArray(i).isNull(1));
              }
            }
          }
        });

    // Test removal in same test, since it's costly to set up the test again.
    // Remove only odd keys
    JavaOnlyArray keyRemoves = new JavaOnlyArray();
    for (int i = 0; i < keyCount; i++) {
      if (i % 2 > 0) {
        keyRemoves.pushString("key" + i);
      }
    }
    mStorage.multiRemove(keyRemoves, mock(Callback.class));
    mStorage.getAllKeys(
        new Callback() {
          @Override
          public void invoke(Object... args) {
            JavaOnlyArray resultArray = (JavaOnlyArray) args[1];
            assertThat(resultArray.size()).isEqualTo(499);
            for (int i = 0; i < resultArray.size(); i++) {
              String key = resultArray.getString(i).substring(3);
              int idx = Integer.parseInt(key);
              assertThat(idx % 2).isEqualTo(0);
            }
          }
        });
  }

  private static JSONArray createJSONArray(Object... objects) {
    return new JSONArray(Arrays.asList(objects));
  }

  private static JSONObject createJSONObject(Object... keysAndValues) {
    if (keysAndValues.length % 2 != 0) {
      throw new IllegalArgumentException("You must provide the same number of keys and values");
    }
    Map map = new HashMap();
    for (int i = 0; i < keysAndValues.length; i += 2) {
      map.put(keysAndValues[i], keysAndValues[i + 1]);
    }
    return new JSONObject(map);
  }

  private JavaOnlyArray getArray(String... values) {
    JavaOnlyArray array = new JavaOnlyArray();
    for (String value : values) {
      array.pushString(value);
    }
    return array;
  }

  private static void waitForAsync() {
    Robolectric.flushForegroundThreadScheduler();
    Robolectric.flushBackgroundThreadScheduler();
  }

  private static <T> T verify(T mock, VerificationMode mode) {
    waitForAsync();
    return Mockito.verify(mock, mode);
  }
}
