/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network

import android.content.Context
import java.io.File
import java.lang.reflect.Field
import okhttp3.OkHttpClient
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever

class OkHttpClientProviderTest {

  private lateinit var sClientField: Field
  private lateinit var sFactoryField: Field

  @Before
  fun setUp() {
    OkHttpClientProvider.setOkHttpClientFactory(null)
    sClientField =
            OkHttpClientProvider::class.java.getDeclaredField("sClient").apply {
              isAccessible = true
            }
    sFactoryField =
            OkHttpClientProvider::class.java.getDeclaredField("sFactory").apply {
              isAccessible = true
            }
  }

  @After
  fun tearDown() {
    OkHttpClientProvider.setOkHttpClientFactory(null)
    sClientField.set(null, null)
    sFactoryField.set(null, null)
  }

  @Test
  fun testSetOkHttpClientFactory() {
    val mockFactory = mock<OkHttpClientFactory>()

    OkHttpClientProvider.setOkHttpClientFactory(mockFactory)

    val factory = sFactoryField.get(null)

    assertThat(factory).isNotNull
    assertThat(factory).isSameAs(mockFactory)
  }

  @Test
  fun testGetOkHttpClientCreatesClientIfNull() {
    val client = OkHttpClientProvider.getOkHttpClient()

    assertThat(client).isNotNull
    assertThat(sClientField.get(null)).isSameAs(client)
  }

  @Test
  fun testGetOkHttpClientDoesNotCreateNewClientIfAlreadyExists() {
    val existingClient = OkHttpClient()
    sClientField.set(null, existingClient)

    val client = OkHttpClientProvider.getOkHttpClient()

    assertThat(client).isNotNull
    assertThat(client).isSameAs(existingClient)
  }

  @Test
  fun testCreateClientUsesCustomFactoryWhenSet() {
    val mockFactory = mock<OkHttpClientFactory>()
    val customClient = OkHttpClient()
    whenever(mockFactory.createNewNetworkModuleClient()).thenReturn(customClient)

    OkHttpClientProvider.setOkHttpClientFactory(mockFactory)

    val client = OkHttpClientProvider.createClient()

    assertThat(client).isNotNull
    assertThat(client).isSameAs(customClient)
    verify(mockFactory).createNewNetworkModuleClient()
  }

  @Test
  fun testCreateClientBuilderDefaultConfiguration() {
    val builder = OkHttpClientProvider.createClientBuilder()
    val client = builder.build()

    assertThat(client.connectTimeoutMillis).isEqualTo(0)
    assertThat(client.readTimeoutMillis).isEqualTo(0)
    assertThat(client.writeTimeoutMillis).isEqualTo(0)
    assertThat(client.cookieJar).isInstanceOf(ReactCookieJarContainer::class.java)
  }

  @Test
  fun testCreateClientBuilderWithContextUsesDefaultCacheSize() {
    val mockContext = mock<Context>()
    val mockCacheDir = File("mockCacheDir")
    whenever(mockContext.cacheDir).thenReturn(mockCacheDir)

    val builder = OkHttpClientProvider.createClientBuilder(mockContext)
    val client = builder.build()
    val cache = client.cache

    assertThat(cache).isNotNull
    assertThat(cache!!.directory).isEqualTo(File(mockCacheDir, "http-cache"))
    assertThat(cache.maxSize()).isEqualTo(10 * 1024 * 1024) // 10 MB
  }

  @Test
  fun testCreateClientBuilderWithZeroCacheSize() {
    val mockContext = mock<Context>()
    val builder = OkHttpClientProvider.createClientBuilder(mockContext, 0)
    val client = builder.build()

    assertThat(client.cache).isNull()
  }

  @Test
  fun testCreateClientBuilderWithCustomCacheSize() {
    val mockContext = mock<Context>()
    val mockCacheDir = File("mockCacheDir")
    whenever(mockContext.cacheDir).thenReturn(mockCacheDir)

    val customCacheSize: Long = 20 * 1024 * 1024 // 20 MB
    val builder = OkHttpClientProvider.createClientBuilder(mockContext, customCacheSize.toInt())
    val client = builder.build()
    val cache = client.cache

    assertThat(cache).isNotNull
    assertThat(cache!!.directory).isEqualTo(File(mockCacheDir, "http-cache"))
    assertThat(cache.maxSize()).isEqualTo(customCacheSize)
  }
}
