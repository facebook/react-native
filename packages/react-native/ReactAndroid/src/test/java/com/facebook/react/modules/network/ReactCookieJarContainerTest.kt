/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network

import java.lang.Exception
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrl
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito.any
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import org.powermock.core.classloader.annotations.PowerMockIgnore
import org.powermock.core.classloader.annotations.PrepareForTest
import org.robolectric.RobolectricTestRunner

/** Tests for {@link NetworkingModule}. */
@PrepareForTest(ReactCookieJarContainer::class)
@RunWith(RobolectricTestRunner::class)
@PowerMockIgnore("org.mockito.*", "org.robolectric.*", "androidx.*", "android.*")
class ReactCookieJarContainerTest {

  @Test
  @Throws(Exception::class)
  fun testMissingJar() {
    val jarContainer: ReactCookieJarContainer = mock(ReactCookieJarContainer::class.java)
    assertThat(jarContainer.loadForRequest("http://example.com".toHttpUrl()).size).isEqualTo(0)
  }

  @Test
  @Throws(Exception::class)
  fun testEmptyCookies() {
    val jarContainer: ReactCookieJarContainer = mock(ReactCookieJarContainer::class.java)
    val cookies: List<Cookie> = listOf<Cookie>()
    `when`(jarContainer.loadForRequest(any(HttpUrl::class.java))).thenReturn(cookies)
    assertThat(jarContainer.loadForRequest("http://example.com".toHttpUrl()).size).isEqualTo(0)
  }

  @Test
  @Throws(Exception::class)
  fun testValidCookies() {
    val jarContainer = ReactCookieJarContainer()
    val cookieJar: CookieJar = mock(CookieJar::class.java)
    jarContainer.setCookieJar(cookieJar)
    val cookies: MutableList<Cookie> = mutableListOf<Cookie>()
    cookies.add(Cookie.Builder().name("valid").value("valid value").domain("domain").build())
    `when`(cookieJar.loadForRequest(any(HttpUrl::class.java))).thenReturn(cookies)
    assertThat(jarContainer.loadForRequest("http://example.com".toHttpUrl()).size).isEqualTo(1)
  }

  @Test
  @Throws(Exception::class)
  fun testInvalidCookies() {
    val jarContainer = ReactCookieJarContainer()
    val cookieJar: CookieJar = mock(CookieJar::class.java)
    jarContainer.setCookieJar(cookieJar)
    val cookies: MutableList<Cookie> = mutableListOf<Cookie>()
    cookies.add(Cookie.Builder().name("valid").value("înválíd välūė").domain("domain").build())
    `when`(cookieJar.loadForRequest(any(HttpUrl::class.java))).thenReturn(cookies)
    assertThat(jarContainer.loadForRequest("http://example.com".toHttpUrl()).size).isEqualTo(0)
  }
}
