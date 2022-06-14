/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network;

import com.facebook.common.logging.FLog;
import com.facebook.react.common.ReactConstants;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CharsetDecoder;

/**
 * Class to decode encoded strings from byte array chunks. As in different encodings single
 * character could take up to 4 characters byte array passed to decode could have parts of the
 * characters which can't be correctly decoded.
 *
 * <p>This class is designed in assumption that original byte stream is correctly formatted string
 * in given encoding. Otherwise some parts of the data won't be decoded.
 */
public class ProgressiveStringDecoder {

  private static final String EMPTY_STRING = "";

  private final CharsetDecoder mDecoder;

  private byte[] remainder = null;

  /** @param charset expected charset of the data */
  public ProgressiveStringDecoder(Charset charset) {
    mDecoder = charset.newDecoder();
  }

  /**
   * Parses data to String If there is a partial multi-byte symbol on the edge of the String it get
   * saved to the reminder and added to the string on the decodeNext call.
   *
   * @param data
   * @return
   */
  public String decodeNext(byte[] data, int length) {
    byte[] decodeData;

    if (remainder != null) {
      decodeData = new byte[remainder.length + length];
      System.arraycopy(remainder, 0, decodeData, 0, remainder.length);
      System.arraycopy(data, 0, decodeData, remainder.length, length);
      length += remainder.length;
    } else {
      decodeData = data;
    }

    ByteBuffer decodeBuffer = ByteBuffer.wrap(decodeData, 0, length);
    CharBuffer result = null;
    boolean decoded = false;
    int remainderLenght = 0;
    while (!decoded && (remainderLenght < 4)) {
      try {
        result = mDecoder.decode(decodeBuffer);
        decoded = true;
      } catch (CharacterCodingException e) {
        remainderLenght++;
        decodeBuffer = ByteBuffer.wrap(decodeData, 0, length - remainderLenght);
      }
    }
    boolean hasRemainder = decoded && remainderLenght > 0;
    if (hasRemainder) {
      remainder = new byte[remainderLenght];
      System.arraycopy(decodeData, length - remainderLenght, remainder, 0, remainderLenght);
    } else {
      remainder = null;
    }

    if (!decoded) {
      FLog.w(ReactConstants.TAG, "failed to decode string from byte array");
      return EMPTY_STRING;
    } else {
      return new String(result.array(), 0, result.length());
    }
  }
}
