/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network

import org.assertj.core.api.Assertions.assertThat
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
    assertThat(HeaderUtil.stripHeaderName(ALPHABET_TEST)).isEqualTo(ALPHABET_TEST)
  }

  @Test
  fun nameStripKeepsNumbers() {
    assertThat(HeaderUtil.stripHeaderName(NUMBERS_TEST)).isEqualTo(NUMBERS_TEST)
  }

  @Test
  fun nameStripKeepsSpecials() {
    assertThat(HeaderUtil.stripHeaderName(SPECIALS_TEST)).isEqualTo(SPECIALS_TEST)
  }

  @Test
  fun nameStripDeletesTabs() {
    assertThat(HeaderUtil.stripHeaderName(TABULATION_TEST)).isEqualTo(TABULATION_STRIP_EXPECTED)
  }

  @Test
  fun nameStripRemovesExtraSymbols() {
    assertThat(HeaderUtil.stripHeaderName(NAME_BANNED_SYMBOLS_TEST)).isEqualTo(BANNED_TEST_EXPECTED)
  }
}
