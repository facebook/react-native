/*
 * Copyright 2014-present Facebook, Inc.
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

#include <glog/logging.h>
#include <sys/types.h>
#include <algorithm>
#include <array>
#include <cstring>
#include <string>
#include <type_traits>

#include <folly/Format.h>
#include <folly/detail/IPAddress.h>

// BSDish platforms don't provide standard access to s6_addr16
#ifndef s6_addr16
#if defined(__APPLE__) || defined(__FreeBSD__) || defined(__NetBSD__) || \
    defined(__OpenBSD__)
#define s6_addr16 __u6_addr.__u6_addr16
#endif
#endif

namespace folly {
namespace detail {

/**
 * Helper for working with unsigned char* or uint8_t* ByteArray values
 */
struct Bytes {
  // mask the values from two byte arrays, returning a new byte array
  template <std::size_t N>
  static std::array<uint8_t, N> mask(
      const std::array<uint8_t, N>& a,
      const std::array<uint8_t, N>& b) {
    static_assert(N > 0, "Can't mask an empty ByteArray");
    std::size_t asize = a.size();
    std::array<uint8_t, N> ba{{0}};
    for (std::size_t i = 0; i < asize; i++) {
      ba[i] = uint8_t(a[i] & b[i]);
    }
    return ba;
  }

  template <std::size_t N>
  static std::pair<std::array<uint8_t, N>, uint8_t> longestCommonPrefix(
      const std::array<uint8_t, N>& one,
      uint8_t oneMask,
      const std::array<uint8_t, N>& two,
      uint8_t twoMask) {
    static constexpr auto kBitCount = N * 8;
    static constexpr std::array<uint8_t, 8> kMasks{{
        0x80, // /1
        0xc0, // /2
        0xe0, // /3
        0xf0, // /4
        0xf8, // /5
        0xfc, // /6
        0xfe, // /7
        0xff // /8
    }};
    if (oneMask > kBitCount || twoMask > kBitCount) {
      throw std::invalid_argument(sformat(
          "Invalid mask length: {}. Mask length must be <= {}",
          std::max(oneMask, twoMask),
          kBitCount));
    }

    auto mask = std::min(oneMask, twoMask);
    uint8_t byteIndex = 0;
    std::array<uint8_t, N> ba{{0}};
    // Compare a byte at a time. Note - I measured compared this with
    // going multiple bytes at a time (8, 4, 2 and 1). It turns out
    // to be 20 - 25% slower for 4 and 16 byte arrays.
    while (byteIndex * 8 < mask && one[byteIndex] == two[byteIndex]) {
      ba[byteIndex] = one[byteIndex];
      ++byteIndex;
    }
    auto bitIndex = std::min(mask, uint8_t(byteIndex * 8));
    uint8_t bI = uint8_t(bitIndex / 8);
    uint8_t bM = uint8_t(bitIndex % 8);
    // Compute the bit up to which the two byte arrays match in the
    // unmatched byte.
    // Here the check is bitIndex < mask since the 0th mask entry in
    // kMasks array holds the mask for masking the MSb in this byte.
    // We could instead make it hold so that no 0th entry masks no
    // bits but thats a useless iteration.
    while (bitIndex < mask &&
           ((one[bI] & kMasks[bM]) == (two[bI] & kMasks[bM]))) {
      ba[bI] = uint8_t(one[bI] & kMasks[bM]);
      ++bitIndex;
      bI = uint8_t(bitIndex / 8);
      bM = uint8_t(bitIndex % 8);
    }
    return {ba, bitIndex};
  }

  // create an in_addr from an uint8_t*
  static inline in_addr mkAddress4(const uint8_t* src) {
    union {
      in_addr addr;
      uint8_t bytes[4];
    } addr;
    std::memset(&addr, 0, 4);
    std::memcpy(addr.bytes, src, 4);
    return addr.addr;
  }

  // create an in6_addr from an uint8_t*
  static inline in6_addr mkAddress6(const uint8_t* src) {
    in6_addr addr;
    std::memset(&addr, 0, 16);
    std::memcpy(addr.s6_addr, src, 16);
    return addr;
  }

  // convert an uint8_t* to its hex value
  static std::string toHex(const uint8_t* src, std::size_t len) {
    static const char* const lut = "0123456789abcdef";
    std::string out(len * 2, 0);
    for (std::size_t i = 0; i < len; i++) {
      const unsigned char c = src[i];
      out[i * 2 + 0] = lut[c >> 4];
      out[i * 2 + 1] = lut[c & 15];
    }
    return out;
  }

 private:
  Bytes() = delete;
  ~Bytes() = delete;
};

//
// Write a maximum amount of base-converted character digits, of a
// given base, from an unsigned integral type into a byte buffer of
// sufficient size.
//
// This function does not append null terminators.
//
// Output buffer size must be guaranteed by caller (indirectly
// controlled by DigitCount template parameter).
//
// Having these parameters at compile time allows compiler to
// precompute several of the values, use smaller instructions, and
// better optimize surrounding code.
//
// IntegralType:
//   - Something like uint8_t, uint16_t, etc
//
// DigitCount is the maximum number of digits to be printed
//   - This is tied to IntegralType and Base. For example:
//     - uint8_t in base 10 will print at most 3 digits ("255")
//     - uint16_t in base 16 will print at most 4 hex digits ("FFFF")
//
// Base is the desired output base of the string
//   - Base 10 will print [0-9], base 16 will print [0-9a-f]
//
// PrintAllDigits:
//   - Whether or not leading zeros should be printed
//
template <
    class IntegralType,
    IntegralType DigitCount,
    IntegralType Base = IntegralType(10),
    bool PrintAllDigits = false,
    class = typename std::enable_if<
        std::is_integral<IntegralType>::value &&
            std::is_unsigned<IntegralType>::value,
        bool>::type>
inline void writeIntegerString(IntegralType val, char** buffer) {
  char* buf = *buffer;

  if (!PrintAllDigits && val == 0) {
    *(buf++) = '0';
    *buffer = buf;
    return;
  }

  IntegralType powerToPrint = 1;
  for (IntegralType i = 1; i < DigitCount; ++i) {
    powerToPrint *= Base;
  }

  bool found = PrintAllDigits;
  while (powerToPrint) {
    if (found || powerToPrint <= val) {
      IntegralType value = IntegralType(val / powerToPrint);
      if (Base == 10 || value < 10) {
        value += '0';
      } else {
        value += ('a' - 10);
      }
      *(buf++) = char(value);
      val %= powerToPrint;
      found = true;
    }

    powerToPrint /= Base;
  }

  *buffer = buf;
}

inline size_t fastIpV4ToBufferUnsafe(const in_addr& inAddr, char* str) {
  const uint8_t* octets = reinterpret_cast<const uint8_t*>(&inAddr.s_addr);
  char* buf = str;

  writeIntegerString<uint8_t, 3>(octets[0], &buf);
  *(buf++) = '.';
  writeIntegerString<uint8_t, 3>(octets[1], &buf);
  *(buf++) = '.';
  writeIntegerString<uint8_t, 3>(octets[2], &buf);
  *(buf++) = '.';
  writeIntegerString<uint8_t, 3>(octets[3], &buf);

  return buf - str;
}

inline std::string fastIpv4ToString(const in_addr& inAddr) {
  char str[sizeof("255.255.255.255")];
  return std::string(str, fastIpV4ToBufferUnsafe(inAddr, str));
}

inline void fastIpv4AppendToString(const in_addr& inAddr, std::string& out) {
  char str[sizeof("255.255.255.255")];
  out.append(str, fastIpV4ToBufferUnsafe(inAddr, str));
}

inline size_t fastIpv6ToBufferUnsafe(const in6_addr& in6Addr, char* str) {
#ifdef _MSC_VER
  const uint16_t* bytes = reinterpret_cast<const uint16_t*>(&in6Addr.u.Word);
#else
  const uint16_t* bytes = reinterpret_cast<const uint16_t*>(&in6Addr.s6_addr16);
#endif
  char* buf = str;

  for (int i = 0; i < 8; ++i) {
    writeIntegerString<
        uint16_t,
        4, // at most 4 hex digits per ushort
        16, // base 16 (hex)
        true>(htons(bytes[i]), &buf);

    if (i != 7) {
      *(buf++) = ':';
    }
  }

  return buf - str;
}

inline std::string fastIpv6ToString(const in6_addr& in6Addr) {
  char str[sizeof("2001:0db8:0000:0000:0000:ff00:0042:8329")];
  return std::string(str, fastIpv6ToBufferUnsafe(in6Addr, str));
}

inline void fastIpv6AppendToString(const in6_addr& in6Addr, std::string& out) {
  char str[sizeof("2001:0db8:0000:0000:0000:ff00:0042:8329")];
  out.append(str, fastIpv6ToBufferUnsafe(in6Addr, str));
}
} // namespace detail
} // namespace folly
