/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import okhttp3.Cookie;
import okhttp3.CookieJar;
import okhttp3.HttpUrl;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.robolectric.RobolectricTestRunner;

/** Tests for {@link NetworkingModule}. */
@PrepareForTest({ReactCookieJarContainer.class})
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
public class ReactCookieJarContainerTest {

  @Test
  public void testMissingJar() throws Exception {
    ReactCookieJarContainer jarContainer = mock(ReactCookieJarContainer.class);
    assertThat(jarContainer.loadForRequest(HttpUrl.parse("http://example.com")).size())
        .isEqualTo(0);
  }

  @Test
  public void testEmptyCookies() throws Exception {
    ReactCookieJarContainer jarContainer = mock(ReactCookieJarContainer.class);
    List<Cookie> cookies = new ArrayList<>();
    when(jarContainer.loadForRequest(any(HttpUrl.class))).thenReturn(cookies);
    assertThat(jarContainer.loadForRequest(HttpUrl.parse("http://example.com")).size())
        .isEqualTo(0);
  }

  @Test
  public void testValidCookies() throws Exception {
    ReactCookieJarContainer jarContainer = new ReactCookieJarContainer();
    CookieJar cookieJar = mock(CookieJar.class);
    jarContainer.setCookieJar(cookieJar);
    List<Cookie> cookies = new ArrayList<>();
    cookies.add(new Cookie.Builder().name("valid").value("valid value").domain("domain").build());
    when(cookieJar.loadForRequest(any(HttpUrl.class))).thenReturn(cookies);
    assertThat(jarContainer.loadForRequest(HttpUrl.parse("http://example.com")).size())
        .isEqualTo(1);
  }

  @Test
  public void testInvalidCookies() throws Exception {
    ReactCookieJarContainer jarContainer = new ReactCookieJarContainer();
    CookieJar cookieJar = mock(CookieJar.class);
    jarContainer.setCookieJar(cookieJar);
    List<Cookie> cookies = new ArrayList<>();
    cookies.add(new Cookie.Builder().name("valid").value("înválíd välūė").domain("domain").build());
    when(cookieJar.loadForRequest(any(HttpUrl.class))).thenReturn(cookies);
    assertThat(jarContainer.loadForRequest(HttpUrl.parse("http://example.com")).size())
        .isEqualTo(0);
  }
}
