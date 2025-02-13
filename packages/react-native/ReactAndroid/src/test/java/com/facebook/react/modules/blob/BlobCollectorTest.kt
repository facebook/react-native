/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.blob

import com.facebook.react.bridge.JavaScriptContextHolder
import com.facebook.react.bridge.ReactContext
import com.facebook.soloader.SoLoader
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.mockito.MockedStatic
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever

class BlobCollectorTest {
  private lateinit var reactContext: ReactContext
  private lateinit var mockedStaticSoLoader: MockedStatic<SoLoader>

  @Before
  fun setUp() {
    reactContext = mock()

    mockedStaticSoLoader = mockStatic(SoLoader::class.java)
    mockedStaticSoLoader
        .`when`<Boolean> { SoLoader.loadLibrary("reactnativeblob") }
        .thenReturn(true)
  }

  @After
  fun tearDown() {
    mockedStaticSoLoader.close()
  }

  @Test
  fun testInstallWithValidJsContext() {
    val jsContextHolder = mock<JavaScriptContextHolder>()
    val jsContext = 1234L

    whenever(reactContext.getJavaScriptContextHolder()).thenReturn(jsContextHolder)
    whenever(jsContextHolder.get()).thenReturn(jsContext)

    BlobCollector.install(reactContext, mock())

    verify(reactContext).runOnJSQueueThread(any())
  }

  @Test
  fun testInstallWithInvalidOrNullJsContext() {
    val jsContextHolder = mock<JavaScriptContextHolder>()

    whenever(reactContext.getJavaScriptContextHolder()).thenReturn(jsContextHolder)
    whenever(jsContextHolder.get()).thenReturn(0L)

    BlobCollector.install(reactContext, mock())

    verify(reactContext).runOnJSQueueThread(any())
  }
}
