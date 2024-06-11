/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network

import com.facebook.common.logging.FLog
import com.facebook.react.common.ReactConstants
import java.nio.ByteBuffer
import java.nio.CharBuffer
import java.nio.charset.CharacterCodingException
import java.nio.charset.Charset
import java.nio.charset.CharsetDecoder

/**
 * Class to decode encoded strings from byte array chunks. As in different encodings single
 * character could take up to 4 characters byte array passed to decode could have parts of the
 * characters which can't be correctly decoded.
 *
 * This class is designed in assumption that original byte stream is correctly formatted string in
 * given encoding. Otherwise some parts of the data won't be decoded.
 */
internal class ProgressiveStringDecoder(charset: Charset) {

  private val decoder: CharsetDecoder = charset.newDecoder()
  private var remainder: ByteArray? = null

  /**
   * Parses data to String If there is a partial multi-byte symbol on the edge of the String it get
   * saved to the reminder and added to the string on the decodeNext call.
   *
   * @param data
   * @return
   */
  fun decodeNext(data: ByteArray, length: Int): String {
    var bufferLength = length
    val currentRemainder = remainder
    val decodeData: ByteArray =
        if (currentRemainder != null) {
          ByteArray(currentRemainder.size + length).also { newData ->
            System.arraycopy(currentRemainder, 0, newData, 0, currentRemainder.size)
            System.arraycopy(data, 0, newData, currentRemainder.size, length)
            bufferLength += currentRemainder.size
          }
        } else {
          data
        }
    var decodeBuffer = ByteBuffer.wrap(decodeData, 0, bufferLength)
    var result: CharBuffer? = null
    var remainderLength = 0
    while (result == null && (remainderLength < MAX_BYTES)) {
      try {
        result = decoder.decode(decodeBuffer)
      } catch (e: CharacterCodingException) {
        remainderLength++
        decodeBuffer = ByteBuffer.wrap(decodeData, 0, bufferLength - remainderLength)
      }
    }
    val hasRemainder = result != null && (remainderLength > 0)
    remainder =
        if (hasRemainder) {
          ByteArray(remainderLength).also { newRemainder ->
            System.arraycopy(
                decodeData, bufferLength - remainderLength, newRemainder, 0, remainderLength)
          }
        } else {
          null
        }
    if (result == null) {
      FLog.w(ReactConstants.TAG, "failed to decode string from byte array")
      return EMPTY_STRING
    } else {
      return String(result.array(), 0, result.length)
    }
  }
}

private const val EMPTY_STRING = ""
private const val MAX_BYTES = 4
