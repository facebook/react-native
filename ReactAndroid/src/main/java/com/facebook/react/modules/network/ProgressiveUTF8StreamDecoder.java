/**
* Copyright (c) 2017-present, Facebook, Inc.
* All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree. An additional grant
* of patent rights can be found in the PATENTS file in the same directory.
*/
package com.facebook.react.modules.network;

import com.facebook.react.common.StandardCharsets;

/**
* Class to decode UTF-8 strings from byte array chunks.
* UTF-8 could have symbol size from 1 to 4 bytes.
* In case of progressive decoding we could accidentally break the original string.
*
* Use this class to make sure that we extract Strings from byte stream correctly.
*/
public class ProgressiveUTF8StreamDecoder {

  private byte[] mRemainder = null;

  /**
   * Bit mask implementation performed 1.5x worse than this one
   *
   * @param firstByte - first byte of the symbol
   * @return count of bytes in the symbol
   */
  private int symbolSize(byte firstByte) {
    int code = firstByte & 0XFF;
    if (code >= 240) {
        return 4;
    } else if (code >= 224 ) {
        return 3;
    } else if (code >= 192 ) {
        return 2;
    }

    return 1;
  }

  /**
   * Parses data to UTF-8 String
   * If last symbol is partial we save it to mRemainder and concatenate it to the next chunk
   * @param data
   * @param length length of data to decode
   * @return
   */
  public String decodeNext(byte[] data, int length) {
    int i = 0;
    int lastSymbolSize = 0;
    if (mRemainder != null) {
      i = symbolSize(mRemainder[0]) - mRemainder.length;
    }
    while (i < length) {
      lastSymbolSize = symbolSize(data[i]);
      i += lastSymbolSize;

    }

    byte[] result;
    int symbolsToCopy = length;
    boolean hasNewReminder = false;
    if (i > length) {
      hasNewReminder = true;
      symbolsToCopy = i - lastSymbolSize;
    }

    if (mRemainder == null) {
      result = data;
    } else {
      result = new byte[symbolsToCopy + mRemainder.length];
      System.arraycopy(mRemainder, 0, result, 0, mRemainder.length);
      System.arraycopy(data, 0, result, mRemainder.length, symbolsToCopy);
      mRemainder = null;
      symbolsToCopy = result.length;
    }

    if (hasNewReminder) {
      int reminderSize =  lastSymbolSize - i + length;
      mRemainder = new byte[reminderSize];
      System.arraycopy(data, length - reminderSize, mRemainder, 0, reminderSize );
    }

    return new String(result, 0, symbolsToCopy, StandardCharsets.UTF_8);
  }
}
