/*
 * Copyright 2013-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <type_traits>

#include <folly/Conv.h>
#include <folly/Expected.h>
#include <folly/Likely.h>
#include <folly/Portability.h>
#include <folly/Range.h>

namespace folly {

/**
 * Variable-length integer encoding, using a little-endian, base-128
 * representation.
 *
 * The MSb is set on all bytes except the last.
 *
 * Details:
 * https://developers.google.com/protocol-buffers/docs/encoding#varints
 *
 * If you want to encode multiple values, GroupVarint (in GroupVarint.h)
 * is faster and likely smaller.
 */

/**
 * Maximum length (in bytes) of the varint encoding of a 32-bit value.
 */
constexpr size_t kMaxVarintLength32 = 5;

/**
 * Maximum length (in bytes) of the varint encoding of a 64-bit value.
 */
constexpr size_t kMaxVarintLength64 = 10;

/**
 * Encode a value in the given buffer, returning the number of bytes used
 * for encoding.
 * buf must have enough space to represent the value (at least
 * kMaxVarintLength64 bytes to encode arbitrary 64-bit values)
 */
size_t encodeVarint(uint64_t val, uint8_t* buf);

/**
 * Determine the number of bytes needed to represent "val".
 * 32-bit values need at most 5 bytes.
 * 64-bit values need at most 10 bytes.
 */
int encodeVarintSize(uint64_t val);

/**
 * Decode a value from a given buffer, advances data past the returned value.
 * Throws on error.
 */
template <class T>
uint64_t decodeVarint(Range<T*>& data);

enum class DecodeVarintError {
  TooManyBytes = 0,
  TooFewBytes = 1,
};

/**
 * A variant of decodeVarint() that does not throw on error. Useful in contexts
 * where only part of a serialized varint may be attempted to be decoded, e.g.,
 * when a serialized varint arrives on the boundary of a network packet.
 */
template <class T>
Expected<uint64_t, DecodeVarintError> tryDecodeVarint(Range<T*>& data);

/**
 * ZigZag encoding that maps signed integers with a small absolute value
 * to unsigned integers with a small (positive) values. Without this,
 * encoding negative values using Varint would use up 9 or 10 bytes.
 *
 * if x >= 0, encodeZigZag(x) == 2*x
 * if x <  0, encodeZigZag(x) == -2*x + 1
 */

inline uint64_t encodeZigZag(int64_t val) {
  // Bit-twiddling magic stolen from the Google protocol buffer document;
  // val >> 63 is an arithmetic shift because val is signed
  auto uval = static_cast<uint64_t>(val);
  return static_cast<uint64_t>((uval << 1) ^ (val >> 63));
}

inline int64_t decodeZigZag(uint64_t val) {
  return static_cast<int64_t>((val >> 1) ^ -(val & 1));
}

// Implementation below

inline size_t encodeVarint(uint64_t val, uint8_t* buf) {
  uint8_t* p = buf;
  while (val >= 128) {
    *p++ = 0x80 | (val & 0x7f);
    val >>= 7;
  }
  *p++ = uint8_t(val);
  return size_t(p - buf);
}

inline int encodeVarintSize(uint64_t val) {
  if (folly::kIsArchAmd64) {
    // __builtin_clzll is undefined for 0
    int highBit = 64 - __builtin_clzll(val | 1);
    return (highBit + 6) / 7;
  } else {
    int s = 1;
    while (val >= 128) {
      ++s;
      val >>= 7;
    }
    return s;
  }
}

template <class T>
inline uint64_t decodeVarint(Range<T*>& data) {
  auto expected = tryDecodeVarint(data);
  if (!expected) {
    throw std::invalid_argument(
        expected.error() == DecodeVarintError::TooManyBytes
            ? "Invalid varint value: too many bytes."
            : "Invalid varint value: too few bytes.");
  }
  return *expected;
}

template <class T>
inline Expected<uint64_t, DecodeVarintError> tryDecodeVarint(Range<T*>& data) {
  static_assert(
      std::is_same<typename std::remove_cv<T>::type, char>::value ||
          std::is_same<typename std::remove_cv<T>::type, unsigned char>::value,
      "Only character ranges are supported");

  const int8_t* begin = reinterpret_cast<const int8_t*>(data.begin());
  const int8_t* end = reinterpret_cast<const int8_t*>(data.end());
  const int8_t* p = begin;
  uint64_t val = 0;

  // end is always greater than or equal to begin, so this subtraction is safe
  if (LIKELY(size_t(end - begin) >= kMaxVarintLength64)) { // fast path
    int64_t b;
    do {
      b = *p++;
      val = (b & 0x7f);
      if (b >= 0) {
        break;
      }
      b = *p++;
      val |= (b & 0x7f) << 7;
      if (b >= 0) {
        break;
      }
      b = *p++;
      val |= (b & 0x7f) << 14;
      if (b >= 0) {
        break;
      }
      b = *p++;
      val |= (b & 0x7f) << 21;
      if (b >= 0) {
        break;
      }
      b = *p++;
      val |= (b & 0x7f) << 28;
      if (b >= 0) {
        break;
      }
      b = *p++;
      val |= (b & 0x7f) << 35;
      if (b >= 0) {
        break;
      }
      b = *p++;
      val |= (b & 0x7f) << 42;
      if (b >= 0) {
        break;
      }
      b = *p++;
      val |= (b & 0x7f) << 49;
      if (b >= 0) {
        break;
      }
      b = *p++;
      val |= (b & 0x7f) << 56;
      if (b >= 0) {
        break;
      }
      b = *p++;
      val |= (b & 0x01) << 63;
      if (b >= 0) {
        break;
      }
      return makeUnexpected(DecodeVarintError::TooManyBytes);
    } while (false);
  } else {
    int shift = 0;
    while (p != end && *p < 0) {
      val |= static_cast<uint64_t>(*p++ & 0x7f) << shift;
      shift += 7;
    }
    if (p == end) {
      return makeUnexpected(DecodeVarintError::TooFewBytes);
    }
    val |= static_cast<uint64_t>(*p++) << shift;
  }

  data.uncheckedAdvance(p - begin);
  return val;
}

} // namespace folly
