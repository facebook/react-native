/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.camera

import android.util.Base64
import android.util.Base64InputStream
import com.facebook.react.bridge.ReactApplicationContext
import java.io.ByteArrayInputStream
import java.io.InputStream
import java.util.*
import org.junit.Assert
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito.*
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ImageStoreManagerTest {

  private lateinit var reactApplicationContext: ReactApplicationContext
  private lateinit var imageStoreManager: ImageStoreManager

  @Before
  fun setUp() {
    reactApplicationContext = mock(ReactApplicationContext::class.java)
    imageStoreManager = ImageStoreManager(reactApplicationContext)
  }

  @Test
  fun itDoesNotAddLineBreaks_whenBasicStringProvided() {
    val exampleString = "test".toByteArray()
    Assert.assertEquals("dGVzdA==", invokeConversion(ByteArrayInputStream(exampleString)))
  }

  @Test
  fun itDoesNotAddLineBreaks_whenEmptyStringProvided() {
    val exampleString = "".toByteArray()
    Assert.assertEquals("", invokeConversion(ByteArrayInputStream(exampleString)))
  }

  @Test
  fun itDoesNotAddLineBreaks_whenStringWithSpecialCharsProvided() {
    val exampleString = "sdfsdf\nasdfsdfsdfsd\r\nasdas".toByteArray()
    val inputStream = ByteArrayInputStream(exampleString)
    val converted = invokeConversion(inputStream)
    Assert.assertFalse(converted.contains("\n"))
  }

  /**
   * This test tries to test the conversion when going beyond the current buffer size (8192 bytes)
   */
  @Test
  fun itDoesNotAddLineBreaks_whenStringBiggerThanBuffer() {
    val inputStream = ByteArrayInputStream(generateRandomByteString(10000))
    val converted = invokeConversion(inputStream)
    Assert.assertFalse(converted.contains("\n"))
  }

  /** Just to test if using the ByteArrayInputStream isn't missing something */
  @Test
  fun itDoesNotAddLineBreaks_whenBase64InputStream() {
    val exampleString = "dGVzdA==".toByteArray()
    val inputStream = Base64InputStream(ByteArrayInputStream(exampleString), Base64.NO_WRAP)
    Assert.assertEquals("dGVzdA==", invokeConversion(inputStream))
  }

  private fun invokeConversion(inputStream: InputStream): String {
    return ImageStoreManager(reactApplicationContext)
        .convertInputStreamToBase64OutputStream(inputStream)
  }

  private fun generateRandomByteString(length: Int): ByteArray {
    val r = Random()
    val sb = StringBuilder()
    repeat(length) {
      val c = r.nextInt(Char.MAX_VALUE.code).toChar()
      sb.append(c)
    }
    return sb.toString().toByteArray()
  }
}
