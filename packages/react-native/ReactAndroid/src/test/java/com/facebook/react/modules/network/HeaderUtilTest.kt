/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network

import org.junit.Assert.assertEquals
import org.junit.Test

class HeaderUtilTest {
  companion object {
    const val TABULATION_TEST = "\teyJhbGciOiJS\t"
    const val TABULATION_STRIP_EXPECTED = "eyJhbGciOiJS"
    const val NUMBERS_TEST = "0123456789"
    const val SPECIALS_TEST = "!@#$%^&*()-=_+{}[]\\|;:'\",.<>/?"
    const val ALPHABET_TEST = "abcdefghijklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWHYZ"
    const val VALUE_BANNED_SYMBOLS_TEST = "���name�����������\u007f\u001f"
    const val NAME_BANNED_SYMBOLS_TEST = "���name�����������\u007f\u0020\u001f"
    const val BANNED_TEST_EXPECTED = "name"
  }

  @Test
  fun nameStripKeepsLetters() {
    assertEquals(ALPHABET_TEST, HeaderUtil.stripHeaderName(ALPHABET_TEST))
  }

  @Test
  fun nameStripKeepsNumbers() {
    assertEquals(NUMBERS_TEST, HeaderUtil.stripHeaderName(NUMBERS_TEST))
  }

  @Test
  fun nameStripKeepsSpecials() {
    assertEquals(SPECIALS_TEST, HeaderUtil.stripHeaderName(SPECIALS_TEST))
  }

  @Test
  fun nameStripDeletesTabs() {
    assertEquals(TABULATION_STRIP_EXPECTED, HeaderUtil.stripHeaderName(TABULATION_TEST))
  }

  @Test
  fun nameStripRemovesExtraSymbols() {
    assertEquals(BANNED_TEST_EXPECTED, HeaderUtil.stripHeaderName(NAME_BANNED_SYMBOLS_TEST))
  }
}
