/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network

import java.io.ByteArrayOutputStream
import java.io.IOException
import java.io.OutputStream
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever

class CountingOutputStreamTest {

  private lateinit var baseStream: ByteArrayOutputStream
  private lateinit var countingStream: CountingOutputStream

  @Before
  fun setUp() {
    baseStream = ByteArrayOutputStream().apply { countingStream = CountingOutputStream(this) }
  }

  @After
  fun tearDown() {
    countingStream.close()
  }

  @Test
  fun testWriteSingleByteIncrementsCount() {
    countingStream.write(0x01)

    assertThat(countingStream.count).isEqualTo(1)
    assertThat(baseStream.toByteArray()).containsExactly(0x01.toByte())
  }

  @Test
  fun testWriteMultipleBytesIndividuallyIncrementsCountCorrectly() {
    countingStream.apply {
      write(0x01)
      write(0x02)
      write(0x03)
    }

    assertThat(countingStream.count).isEqualTo(3)
    assertThat(baseStream.toByteArray())
            .containsExactly(0x01.toByte(), 0x02.toByte(), 0x03.toByte())
  }

  @Test
  fun testWriteByteArrayIncrementsCountCorrectly() {
    byteArrayOf(0x01, 0x02, 0x03).apply { countingStream.write(this) }

    assertThat(countingStream.count).isEqualTo(3)
    assertThat(baseStream.toByteArray()).containsExactly(0x01, 0x02, 0x03)
  }

  @Test
  fun testWriteByteArrayWithOffsetIncrementsCountCorrectly() {
    byteArrayOf(0x01, 0x02, 0x03, 0x04, 0x05).apply { countingStream.write(this, 1, 3) }

    assertThat(countingStream.count).isEqualTo(3)
    assertThat(baseStream.toByteArray()).containsExactly(0x02, 0x03, 0x04)
  }

  @Test
  fun testWriteLargeByteArrayIncrementsCountCorrectly() {
    val largeByteArray = ByteArray(32768) { it.toByte() }.apply { countingStream.write(this) }

    assertThat(countingStream.count).isEqualTo(32768)
    assertThat(baseStream.toByteArray()).isEqualTo(largeByteArray)
  }

  @Test
  fun testCloseCallsCloseOnUnderlyingStream() {
    val mockOutputStream = mock<OutputStream>().apply { CountingOutputStream(this).close() }

    verify(mockOutputStream, times(1)).close()
  }

  @Test
  fun testCloseDoesNotCallFlush() {
    val mockOutputStream = mock<OutputStream>().apply { CountingOutputStream(this).close() }

    verify(mockOutputStream, times(1)).close()
    verify(mockOutputStream, times(0)).flush()
  }

  @Test
  fun testWriteDoesNotCallFlushOnUnderlyingStream() {
    val mockOutputStream = mock<OutputStream>().apply { CountingOutputStream(this).write(0x01) }

    verify(mockOutputStream, times(1)).write(0x01)
    verify(mockOutputStream, times(0)).flush()
  }

  @Test(expected = IOException::class)
  fun testWriteThrowsIOExceptionWhenUnderlyingStreamFails() {
    val mockOutputStream =
            mock<OutputStream>().apply {
              whenever(write(any<Int>())).thenThrow(IOException("Write error"))
            }

    val stream = CountingOutputStream(mockOutputStream)
    stream.write(0x01)
  }

  @Test(expected = IOException::class)
  fun testWriteByteArrayThrowsIOExceptionWhenUnderlyingStreamFails() {
    val mockOutputStream =
            mock<OutputStream>().apply {
              whenever(write(any(), any(), any())).thenThrow(IOException("Write error"))
            }

    val stream = CountingOutputStream(mockOutputStream)
    stream.write(byteArrayOf(0x01, 0x02, 0x03))
  }
}
