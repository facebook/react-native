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
   * @param data The byte array containing the encoded string data.
   * @param initialLength The number of valid bytes in the provided data array that should be
   *   decoded.
   * @return The decoded string. If decoding fails, an empty string is returned.
   */
  fun decodeNext(data: ByteArray, initialLength: Int): String {
    var length = initialLength
    var decodeData: ByteArray = data

    remainder?.let { r ->
      decodeData = ByteArray(r.size + length)
      System.arraycopy(r, 0, decodeData, 0, r.size)
      System.arraycopy(data, 0, decodeData, r.size, length)
      length += r.size
    }

    var decodeBuffer = ByteBuffer.wrap(decodeData, 0, length)
    var result: CharBuffer? = null
    var decoded = false
    var remainderLength = 0

    while (!decoded && (remainderLength < 4)) {
      try {
        result = decoder.decode(decodeBuffer)
        decoded = true
      } catch (e: CharacterCodingException) {
        remainderLength++
        decodeBuffer = ByteBuffer.wrap(decodeData, 0, length - remainderLength)
      }
    }

    val hasRemainder = decoded && remainderLength > 0
    remainder =
        if (hasRemainder) {
          ByteArray(remainderLength).apply {
            System.arraycopy(decodeData, length - remainderLength, this, 0, remainderLength)
          }
        } else {
          null
        }

    if (!decoded) {
      FLog.w(ReactConstants.TAG, "failed to decode string from byte array")
      return EMPTY_STRING
    } else {
      return result?.let { String(it.array(), 0, it.length) } ?: EMPTY_STRING
    }
  }

  companion object {
    private const val EMPTY_STRING = ""
  }
}
