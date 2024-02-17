/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network

import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito.any
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when` as whenever
import org.robolectric.RobolectricTestRunner

/** Tests for {@link NetworkingModule}. */
@RunWith(RobolectricTestRunner::class)
class ReactCookieJarContainerTest {
  private val httpUrl: HttpUrl = HttpUrl.Builder().host("example.com").scheme("http").build()

  @Test
  fun testMissingJar() {
    val jarContainer: ReactCookieJarContainer = mock(ReactCookieJarContainer::class.java)
    assertThat(jarContainer.loadForRequest(httpUrl).size).isEqualTo(0)
  }

  @Test
  fun testEmptyCookies() {
    val jarContainer: ReactCookieJarContainer = mock(ReactCookieJarContainer::class.java)
    val cookies: List<Cookie> = emptyList()
    whenever(jarContainer.loadForRequest(any(HttpUrl::class.java))).thenReturn(cookies)
    assertThat(jarContainer.loadForRequest(httpUrl).size).isEqualTo(0)
  }

  @Test
  fun testValidCookies() {
    val jarContainer = ReactCookieJarContainer()
    val cookieJar: CookieJar = mock(CookieJar::class.java)
    jarContainer.setCookieJar(cookieJar)
    val cookies: MutableList<Cookie> = mutableListOf()
    cookies.add(Cookie.Builder().name("valid").value("valid value").domain("domain").build())
    whenever(cookieJar.loadForRequest(httpUrl)).thenReturn(cookies)
    assertThat(jarContainer.loadForRequest(httpUrl).size).isEqualTo(1)
  }

  @Test
  fun testInvalidCookies() {
    val jarContainer = ReactCookieJarContainer()
    val cookieJar: CookieJar = mock(CookieJar::class.java)
    jarContainer.setCookieJar(cookieJar)
    val cookies: MutableList<Cookie> = mutableListOf()
    cookies.add(Cookie.Builder().name("valid").value("înválíd välūė").domain("domain").build())
    whenever(cookieJar.loadForRequest(httpUrl)).thenReturn(cookies)
    assertThat(jarContainer.loadForRequest(httpUrl).size).isEqualTo(0)
  }
}
