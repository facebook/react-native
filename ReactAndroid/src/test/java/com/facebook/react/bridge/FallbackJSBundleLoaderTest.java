/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import static org.fest.assertions.api.Assertions.assertThat;
import static org.fest.assertions.api.Assertions.fail;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.facebook.common.logging.FLog;
import com.facebook.common.logging.FakeLoggingDelegate;
import java.util.ArrayList;
import java.util.Arrays;
import org.junit.Before;
import org.junit.Test;

public class FallbackJSBundleLoaderTest {

  private static final String UNRECOVERABLE;

  static {
    String prefix = FallbackJSBundleLoader.RECOVERABLE;
    char first = prefix.charAt(0);

    UNRECOVERABLE = prefix.replace(first, (char) (first + 1));
  }

  private FakeLoggingDelegate mLoggingDelegate;

  @Before
  public void setup() {
    mLoggingDelegate = new FakeLoggingDelegate();
    FLog.setLoggingDelegate(mLoggingDelegate);
  }

  @Test
  public void firstLoaderSucceeds() {
    JSBundleLoader delegates[] =
        new JSBundleLoader[] {successfulLoader("url1"), successfulLoader("url2")};

    FallbackJSBundleLoader fallbackLoader =
        new FallbackJSBundleLoader(new ArrayList<>(Arrays.asList(delegates)));

    assertThat(fallbackLoader.loadScript(null)).isEqualTo("url1");

    verify(delegates[0], times(1)).loadScript(null);
    verify(delegates[1], never()).loadScript(null);

    assertThat(
            mLoggingDelegate.logContains(FakeLoggingDelegate.WTF, FallbackJSBundleLoader.TAG, null))
        .isFalse();
  }

  @Test
  public void fallingBackSuccessfully() {
    JSBundleLoader delegates[] =
        new JSBundleLoader[] {
          recoverableLoader("url1", "error1"), successfulLoader("url2"), successfulLoader("url3")
        };

    FallbackJSBundleLoader fallbackLoader =
        new FallbackJSBundleLoader(new ArrayList<>(Arrays.asList(delegates)));

    assertThat(fallbackLoader.loadScript(null)).isEqualTo("url2");

    verify(delegates[0], times(1)).loadScript(null);
    verify(delegates[1], times(1)).loadScript(null);
    verify(delegates[2], never()).loadScript(null);

    assertThat(
            mLoggingDelegate.logContains(
                FakeLoggingDelegate.WTF, FallbackJSBundleLoader.TAG, recoverableMsg("error1")))
        .isTrue();
  }

  @Test
  public void fallingbackUnsuccessfully() {
    JSBundleLoader delegates[] =
        new JSBundleLoader[] {
          recoverableLoader("url1", "error1"), recoverableLoader("url2", "error2")
        };

    FallbackJSBundleLoader fallbackLoader =
        new FallbackJSBundleLoader(new ArrayList<>(Arrays.asList(delegates)));

    try {
      fallbackLoader.loadScript(null);
      fail("expect throw");
    } catch (Exception e) {
      assertThat(e).isInstanceOf(RuntimeException.class);

      Throwable cause = e.getCause();
      ArrayList<String> msgs = new ArrayList<>();
      while (cause != null) {
        msgs.add(cause.getMessage());
        cause = cause.getCause();
      }

      assertThat(msgs).containsExactly(recoverableMsg("error1"), recoverableMsg("error2"));
    }

    verify(delegates[0], times(1)).loadScript(null);
    verify(delegates[1], times(1)).loadScript(null);

    assertThat(
            mLoggingDelegate.logContains(
                FakeLoggingDelegate.WTF, FallbackJSBundleLoader.TAG, recoverableMsg("error1")))
        .isTrue();

    assertThat(
            mLoggingDelegate.logContains(
                FakeLoggingDelegate.WTF, FallbackJSBundleLoader.TAG, recoverableMsg("error2")))
        .isTrue();
  }

  @Test
  public void unrecoverable() {
    JSBundleLoader delegates[] =
        new JSBundleLoader[] {fatalLoader("url1", "error1"), recoverableLoader("url2", "error2")};

    FallbackJSBundleLoader fallbackLoader =
        new FallbackJSBundleLoader(new ArrayList(Arrays.asList(delegates)));

    try {
      fallbackLoader.loadScript(null);
      fail("expect throw");
    } catch (Exception e) {
      assertThat(e.getMessage()).isEqualTo(fatalMsg("error1"));
    }

    verify(delegates[0], times(1)).loadScript(null);
    verify(delegates[1], never()).loadScript(null);

    assertThat(
            mLoggingDelegate.logContains(FakeLoggingDelegate.WTF, FallbackJSBundleLoader.TAG, null))
        .isFalse();
  }

  private static JSBundleLoader successfulLoader(String url) {
    JSBundleLoader loader = mock(JSBundleLoader.class);
    when(loader.loadScript(null)).thenReturn(url);

    return loader;
  }

  private static String recoverableMsg(String errMsg) {
    return FallbackJSBundleLoader.RECOVERABLE + errMsg;
  }

  private static JSBundleLoader recoverableLoader(String url, String errMsg) {
    JSBundleLoader loader = mock(JSBundleLoader.class);
    when(loader.loadScript(null))
        .thenThrow(new RuntimeException(FallbackJSBundleLoader.RECOVERABLE + errMsg));

    return loader;
  }

  private static String fatalMsg(String errMsg) {
    return UNRECOVERABLE + errMsg;
  }

  private static JSBundleLoader fatalLoader(String url, String errMsg) {
    JSBundleLoader loader = mock(JSBundleLoader.class);
    when(loader.loadScript(null)).thenThrow(new RuntimeException(UNRECOVERABLE + errMsg));

    return loader;
  }
}
