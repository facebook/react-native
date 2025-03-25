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
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever

/** Tests for {@link NetworkingModule}. */
class ReactCookieJarContainerTest {
  private val httpUrl: HttpUrl = HttpUrl.Builder().host("example.com").scheme("http").build()

  @Test
  fun testMissingJar() {
    val jarContainer = ReactCookieJarContainer()
    assertThat(jarContainer.loadForRequest(httpUrl).size).isEqualTo(0)
  }

  @Test
  fun testEmptyCookies() {
    val jarContainer = ReactCookieJarContainer()
    val cookieJar = mock<CookieJar>()
    jarContainer.setCookieJar(cookieJar)
    whenever(cookieJar.loadForRequest(any())).thenReturn(emptyList())
    assertThat(jarContainer.loadForRequest(httpUrl).size).isEqualTo(0)
  }

  @Test
  fun testValidCookies() {
    val jarContainer = ReactCookieJarContainer()
    val cookieJar = mock<CookieJar>()
    jarContainer.setCookieJar(cookieJar)
    val cookies =
        listOf(Cookie.Builder().name("valid").value("valid value").domain("domain").build())
    whenever(cookieJar.loadForRequest(httpUrl)).thenReturn(cookies)
    assertThat(jarContainer.loadForRequest(httpUrl).size).isEqualTo(1)
  }

  @Test
  fun testInvalidCookies() {
    val jarContainer = ReactCookieJarContainer()
    val cookieJar = mock<CookieJar>()
    jarContainer.setCookieJar(cookieJar)
    val cookies =
        listOf(Cookie.Builder().name("valid").value("înválíd välūė").domain("domain").build())
    whenever(cookieJar.loadForRequest(httpUrl)).thenReturn(cookies)
    assertThat(jarContainer.loadForRequest(httpUrl).size).isEqualTo(0)
  }
}
