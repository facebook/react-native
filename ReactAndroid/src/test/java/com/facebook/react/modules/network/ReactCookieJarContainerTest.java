/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network;

import com.facebook.react.modules.network.ReactCookieJarContainer;
import okhttp3.Cookie;
import okhttp3.CookieJar;
import okhttp3.HttpUrl;
import java.util.List;
import java.util.ArrayList;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.robolectric.RobolectricTestRunner;

import static org.fest.assertions.api.Assertions.assertThat;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests for {@link NetworkingModule}.
 */
@PrepareForTest({
  ReactCookieJarContainer.class
})
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})

public class ReactCookieJarContainerTest {

  @Test
  public void testMissingJar() throws Exception {
    ReactCookieJarContainer jarContainer = mock(ReactCookieJarContainer.class);
    assertThat(jarContainer.loadForRequest(any(HttpUrl.class)).size()).isEqualTo(0);
  }

  @Test
  public void testEmptyCookies() throws Exception {
    ReactCookieJarContainer jarContainer = mock(ReactCookieJarContainer.class);
    List<Cookie> cookies = new ArrayList<>();
    when(jarContainer.loadForRequest(any(HttpUrl.class))).thenReturn(cookies);
    assertThat(jarContainer.loadForRequest(any(HttpUrl.class)).size()).isEqualTo(0);
  }

  @Test
  public void testValidCookies() throws Exception {
    ReactCookieJarContainer jarContainer = new ReactCookieJarContainer();
    CookieJar cookieJar = mock(CookieJar.class);
    jarContainer.setCookieJar(cookieJar);
    List<Cookie> cookies = new ArrayList<>();
    cookies.add(new Cookie.Builder()
      .name("valid")
      .value("valid value")
      .domain("domain")
      .build()
    );
    when(cookieJar.loadForRequest(any(HttpUrl.class))).thenReturn(cookies);
    assertThat(jarContainer.loadForRequest(any(HttpUrl.class)).size()).isEqualTo(1);
  }

  @Test
  public void testInvalidCookies() throws Exception {
    ReactCookieJarContainer jarContainer = new ReactCookieJarContainer();
    CookieJar cookieJar = mock(CookieJar.class);
    jarContainer.setCookieJar(cookieJar);
    List<Cookie> cookies = new ArrayList<>();
    cookies.add(new Cookie.Builder()
      .name("valid")
      .value("înválíd välūė")
      .domain("domain")
      .build()
    );
    when(cookieJar.loadForRequest(any(HttpUrl.class))).thenReturn(cookies);
    assertThat(jarContainer.loadForRequest(any(HttpUrl.class)).size()).isEqualTo(0);
  }
}
