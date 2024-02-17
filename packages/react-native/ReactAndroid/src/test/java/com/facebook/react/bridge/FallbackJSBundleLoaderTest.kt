/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.common.logging.FLog
import com.facebook.common.logging.FakeLoggingDelegate
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.fail
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito.*
import org.mockito.Mockito.`when` as whenever

class FallbackJSBundleLoaderTest {
  private lateinit var UNRECOVERABLE: String
  private lateinit var loggingDelegate: FakeLoggingDelegate

  @Before
  fun setup() {
    val prefix = FallbackJSBundleLoader.RECOVERABLE
    val first = prefix[0]
    UNRECOVERABLE = prefix.replace(first, (first.code + 1).toChar())

    loggingDelegate = FakeLoggingDelegate()
    FLog.setLoggingDelegate(loggingDelegate)
  }

  @Test
  fun firstLoaderSucceeds() {
    val delegates = arrayOf(successfulLoader("url1"), successfulLoader("url2"))

    val fallbackLoader = FallbackJSBundleLoader(listOf(*delegates))

    assertThat(fallbackLoader.loadScript(null)).isEqualTo("url1")

    verify(delegates[0], times(1)).loadScript(null)
    verify(delegates[1], never()).loadScript(null)

    assertThat(
            loggingDelegate.logContains(FakeLoggingDelegate.WTF, FallbackJSBundleLoader.TAG, null))
        .isFalse
  }

  @Test
  fun fallingBackSuccessfully() {
    val delegates =
        arrayOf(
            recoverableLoader("url1", "error1"), successfulLoader("url2"), successfulLoader("url3"))

    val fallbackLoader = FallbackJSBundleLoader(listOf(*delegates))

    assertThat(fallbackLoader.loadScript(null)).isEqualTo("url2")

    verify(delegates[0], times(1)).loadScript(null)
    verify(delegates[1], times(1)).loadScript(null)
    verify(delegates[2], never()).loadScript(null)

    assertThat(
            loggingDelegate.logContains(
                FakeLoggingDelegate.WTF, FallbackJSBundleLoader.TAG, recoverableMsg("error1")))
        .isTrue
  }

  @Test
  fun fallingbackUnsuccessfully() {
    val delegates =
        arrayOf(recoverableLoader("url1", "error1"), recoverableLoader("url2", "error2"))

    val fallbackLoader = FallbackJSBundleLoader(listOf(*delegates))

    try {
      fallbackLoader.loadScript(null)
      fail("expect throw")
    } catch (e: Exception) {
      assertThat(e).isInstanceOf(RuntimeException::class.java)

      var cause = e.cause
      val msgs = mutableListOf<String?>()

      while (cause != null) {
        msgs.add(cause.message)
        cause = cause.cause
      }

      assertThat(msgs).containsExactly(recoverableMsg("error1"), recoverableMsg("error2"))
    }

    verify(delegates[0], times(1)).loadScript(null)
    verify(delegates[1], times(1)).loadScript(null)

    assertThat(
            loggingDelegate.logContains(
                FakeLoggingDelegate.WTF, FallbackJSBundleLoader.TAG, recoverableMsg("error1")))
        .isTrue

    assertThat(
            loggingDelegate.logContains(
                FakeLoggingDelegate.WTF, FallbackJSBundleLoader.TAG, recoverableMsg("error2")))
        .isTrue
  }

  @Test
  fun unrecoverable() {
    val delegates = arrayOf(fatalLoader("url1", "error1"), recoverableLoader("url2", "error2"))

    val fallbackLoader = FallbackJSBundleLoader(listOf(*delegates))

    try {
      fallbackLoader.loadScript(null)
      fail("expect throw")
    } catch (e: Exception) {
      assertThat(e.message).isEqualTo(fatalMsg("error1"))
    }

    verify(delegates[0], times(1)).loadScript(null)
    verify(delegates[1], never()).loadScript(null)

    assertThat(
            loggingDelegate.logContains(FakeLoggingDelegate.WTF, FallbackJSBundleLoader.TAG, null))
        .isFalse
  }

  private fun successfulLoader(url: String): JSBundleLoader {
    val loader = mock(JSBundleLoader::class.java)
    whenever(loader.loadScript(null)).thenReturn(url)

    return loader
  }

  private fun recoverableMsg(errMsg: String): String = FallbackJSBundleLoader.RECOVERABLE + errMsg

  @Suppress("UNUSED_PARAMETER")
  private fun recoverableLoader(url: String, errMsg: String): JSBundleLoader {
    val loader = mock(JSBundleLoader::class.java)
    whenever(loader.loadScript(null))
        .thenThrow(RuntimeException(FallbackJSBundleLoader.RECOVERABLE + errMsg))

    return loader
  }

  private fun fatalMsg(errMsg: String): String = UNRECOVERABLE + errMsg

  @Suppress("UNUSED_PARAMETER")
  private fun fatalLoader(url: String, errMsg: String): JSBundleLoader {
    val loader = mock(JSBundleLoader::class.java)
    whenever(loader.loadScript(null)).thenThrow(RuntimeException(UNRECOVERABLE + errMsg))

    return loader
  }
}
