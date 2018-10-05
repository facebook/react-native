/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network;

import org.junit.Test;

import static org.junit.Assert.assertEquals;

public class HeaderUtilTest {
  public static final String TABULATION_TEST = "\teyJhbGciOiJS\t";
  public static final String TABULATION_STRIP_EXPECTED = "eyJhbGciOiJS";
  public static final String NUMBERS_TEST = "0123456789";
  public static final String SPECIALS_TEST = "!@#$%^&*()-=_+{}[]\\|;:'\",.<>/?";
  public static final String ALPHABET_TEST = "abcdefghijklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWHYZ";
  public static final String VALUE_BANNED_SYMBOLS_TEST = "���name�����������\u007f\u001f";
  public static final String NAME_BANNED_SYMBOLS_TEST = "���name�����������\u007f\u0020\u001f";
  public static final String BANNED_TEST_EXPECTED = "name";

  @Test
  public void nameStripKeepsLetters() {
    assertEquals(ALPHABET_TEST, HeaderUtil.stripHeaderName(ALPHABET_TEST));

  }

  @Test
  public void valueStripKeepsLetters() {
    assertEquals(ALPHABET_TEST, HeaderUtil.stripHeaderValue(ALPHABET_TEST));
  }

  @Test
  public void nameStripKeepsNumbers() {
    assertEquals(NUMBERS_TEST, HeaderUtil.stripHeaderName(NUMBERS_TEST));

  }

  @Test
  public void valueStripKeepsNumbers() {
    assertEquals(NUMBERS_TEST, HeaderUtil.stripHeaderValue(NUMBERS_TEST));
  }

  @Test
  public void valueStripKeepsSpecials() {
    assertEquals(SPECIALS_TEST, HeaderUtil.stripHeaderValue(SPECIALS_TEST));
  }

  @Test
  public void nameStripKeepsSpecials() {
    assertEquals(SPECIALS_TEST, HeaderUtil.stripHeaderName(SPECIALS_TEST));
  }

  @Test
  public void valueStripKeepsTabs() {
    assertEquals(TABULATION_TEST, HeaderUtil.stripHeaderValue(TABULATION_TEST));
  }

  @Test
  public void nameStripDeletesTabs() {
    assertEquals(TABULATION_STRIP_EXPECTED, HeaderUtil.stripHeaderName(TABULATION_TEST));
  }

  @Test
  public void valueStripRemovesExtraSymbols() {
    assertEquals(BANNED_TEST_EXPECTED, HeaderUtil.stripHeaderValue(VALUE_BANNED_SYMBOLS_TEST));
  }

  @Test
  public void nameStripRemovesExtraSymbols() {
    assertEquals(BANNED_TEST_EXPECTED, HeaderUtil.stripHeaderName(NAME_BANNED_SYMBOLS_TEST));
  }

}
