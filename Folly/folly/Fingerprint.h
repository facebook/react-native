/*
 * Copyright 2012-present Facebook, Inc.
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

/**
 * Compute 64-, 96-, and 128-bit Rabin fingerprints, as described in
 * Michael O. Rabin (1981)
 *   Fingerprinting by Random Polynomials
 *   Center for Research in Computing Technology, Harvard University
 *   Tech Report TR-CSE-03-01
 *
 * The implementation follows the optimization described in
 * Andrei Z. Broder (1993)
 *   Some applications of Rabin's fingerprinting method
 *
 * extended for fingerprints larger than 64 bits, and modified to use
 * 64-bit instead of 32-bit integers for computation.
 *
 * The precomputed tables are in Fingerprint.cpp.
 *
 * Benchmarked on 10/13/2009 on a 2.5GHz quad-core Xeon L5420,
 * - Fingerprint<64>::update64() takes about 12ns
 * - Fingerprint<96>::update64() takes about 30ns
 * - Fingerprint<128>::update128() takes about 30ns
 * (unsurprisingly, Fingerprint<96> and Fingerprint<128> take the
 * same amount of time, as they both use 128-bit operations; the least
 * significant 32 bits of Fingerprint<96> will always be 0)
 *
 * @author Tudor Bosman (tudorb@facebook.com)
 */

#pragma once

#include <array>
#include <cstdint>

#include <folly/Range.h>

namespace folly {

namespace detail {

constexpr size_t poly_size(size_t bits) {
  return 1 + (bits - 1) / 64;
}

template <size_t Deg>
using poly_table =
    std::array<std::array<std::array<uint64_t, poly_size(Deg)>, 256>, 8>;

template <int BITS>
struct FingerprintTable {
  static const uint64_t poly[poly_size(BITS)];
  static const poly_table<BITS> table;
};

template <int BITS>
const uint64_t FingerprintTable<BITS>::poly[poly_size(BITS)] = {};
template <int BITS>
const poly_table<BITS> FingerprintTable<BITS>::table = {};

#ifndef _MSC_VER
// MSVC 2015 can't handle these extern specialization declarations,
// but they aren't needed for things to work right, so we just don't
// declare them in the header for MSVC.

#define FOLLY_DECLARE_FINGERPRINT_TABLES(BITS)                  \
  template <>                                                   \
  const uint64_t FingerprintTable<BITS>::poly[poly_size(BITS)]; \
  template <>                                                   \
  const poly_table<BITS> FingerprintTable<BITS>::table

FOLLY_DECLARE_FINGERPRINT_TABLES(64);
FOLLY_DECLARE_FINGERPRINT_TABLES(96);
FOLLY_DECLARE_FINGERPRINT_TABLES(128);

#undef FOLLY_DECLARE_FINGERPRINT_TABLES
#endif

} // namespace detail

/**
 * Compute the Rabin fingerprint.
 *
 * TODO(tudorb): Extend this to allow removing values from the computed
 * fingerprint (so we can fingerprint a sliding window, as in the Rabin-Karp
 * string matching algorithm)
 *
 * update* methods return *this, so you can chain them together:
 * Fingerprint<96>().update8(x).update(str).update64(val).write(output);
 */
template <int BITS>
class Fingerprint {
 public:
  Fingerprint() {
    // Use a non-zero starting value. We'll use (1 << (BITS-1))
    fp_[0] = 1ULL << 63;
    for (int i = 1; i < size(); i++) {
      fp_[i] = 0;
    }
  }

  Fingerprint& update8(uint8_t v) {
    uint8_t out = shlor8(v);
    xortab(detail::FingerprintTable<BITS>::table[0][out]);
    return *this;
  }

  // update32 and update64 are convenience functions to update the fingerprint
  // with 4 and 8 bytes at a time.  They are faster than calling update8
  // in a loop.  They process the bytes in big-endian order.
  Fingerprint& update32(uint32_t v) {
    uint32_t out = shlor32(v);
    for (int i = 0; i < 4; i++) {
      xortab(detail::FingerprintTable<BITS>::table[i][out & 0xff]);
      out >>= 8;
    }
    return *this;
  }

  Fingerprint& update64(uint64_t v) {
    uint64_t out = shlor64(v);
    for (int i = 0; i < 8; i++) {
      xortab(detail::FingerprintTable<BITS>::table[i][out & 0xff]);
      out >>= 8;
    }
    return *this;
  }

  Fingerprint& update(StringPiece str) {
    // TODO(tudorb): We could be smart and do update64 or update32 if aligned
    for (auto c : str) {
      update8(uint8_t(c));
    }
    return *this;
  }

  /**
   * Return the number of uint64s needed to hold the fingerprint value.
   */
  constexpr static int size() {
    return detail::poly_size(BITS);
  }

  /**
   * Write the computed fingeprint to an array of size() uint64_t's.
   * For Fingerprint<64>,  size()==1; we write 64 bits in out[0]
   * For Fingerprint<96>,  size()==2; we write 64 bits in out[0] and
   *                                  the most significant 32 bits of out[1]
   * For Fingerprint<128>, size()==2; we write 64 bits in out[0] and
   *                                  64 bits in out[1].
   */
  void write(uint64_t* out) const {
    for (int i = 0; i < size(); i++) {
      out[i] = fp_[i];
    }
  }

 private:
  // XOR the fingerprint with a value from one of the tables.
  void xortab(std::array<uint64_t, detail::poly_size(BITS)> const& tab) {
    for (int i = 0; i < size(); i++) {
      fp_[i] ^= tab[i];
    }
  }

  // Helper functions: shift the fingerprint value left by 8/32/64 bits,
  // return the "out" value (the bits that were shifted out), and add "v"
  // in the bits on the right.
  uint8_t shlor8(uint8_t v);
  uint32_t shlor32(uint32_t v);
  uint64_t shlor64(uint64_t v);

  uint64_t fp_[detail::poly_size(BITS)];
};

// Convenience functions

/**
 * Return the 64-bit Rabin fingerprint of a string.
 */
inline uint64_t fingerprint64(StringPiece str) {
  uint64_t fp;
  Fingerprint<64>().update(str).write(&fp);
  return fp;
}

/**
 * Compute the 96-bit Rabin fingerprint of a string.
 * Return the 64 most significant bits in *msb, and the 32 least significant
 * bits in *lsb.
 */
inline void fingerprint96(StringPiece str, uint64_t* msb, uint32_t* lsb) {
  uint64_t fp[2];
  Fingerprint<96>().update(str).write(fp);
  *msb = fp[0];
  *lsb = (uint32_t)(fp[1] >> 32);
}

/**
 * Compute the 128-bit Rabin fingerprint of a string.
 * Return the 64 most significant bits in *msb, and the 64 least significant
 * bits in *lsb.
 */
inline void fingerprint128(StringPiece str, uint64_t* msb, uint64_t* lsb) {
  uint64_t fp[2];
  Fingerprint<128>().update(str).write(fp);
  *msb = fp[0];
  *lsb = fp[1];
}

template <>
inline uint8_t Fingerprint<64>::shlor8(uint8_t v) {
  uint8_t out = (uint8_t)(fp_[0] >> 56);
  fp_[0] = (fp_[0] << 8) | ((uint64_t)v);
  return out;
}

template <>
inline uint32_t Fingerprint<64>::shlor32(uint32_t v) {
  uint32_t out = (uint32_t)(fp_[0] >> 32);
  fp_[0] = (fp_[0] << 32) | ((uint64_t)v);
  return out;
}

template <>
inline uint64_t Fingerprint<64>::shlor64(uint64_t v) {
  uint64_t out = fp_[0];
  fp_[0] = v;
  return out;
}

template <>
inline uint8_t Fingerprint<96>::shlor8(uint8_t v) {
  uint8_t out = (uint8_t)(fp_[0] >> 56);
  fp_[0] = (fp_[0] << 8) | (fp_[1] >> 56);
  fp_[1] = (fp_[1] << 8) | ((uint64_t)v << 32);
  return out;
}

template <>
inline uint32_t Fingerprint<96>::shlor32(uint32_t v) {
  uint32_t out = (uint32_t)(fp_[0] >> 32);
  fp_[0] = (fp_[0] << 32) | (fp_[1] >> 32);
  fp_[1] = ((uint64_t)v << 32);
  return out;
}

template <>
inline uint64_t Fingerprint<96>::shlor64(uint64_t v) {
  uint64_t out = fp_[0];
  fp_[0] = fp_[1] | (v >> 32);
  fp_[1] = v << 32;
  return out;
}

template <>
inline uint8_t Fingerprint<128>::shlor8(uint8_t v) {
  uint8_t out = (uint8_t)(fp_[0] >> 56);
  fp_[0] = (fp_[0] << 8) | (fp_[1] >> 56);
  fp_[1] = (fp_[1] << 8) | ((uint64_t)v);
  return out;
}

template <>
inline uint32_t Fingerprint<128>::shlor32(uint32_t v) {
  uint32_t out = (uint32_t)(fp_[0] >> 32);
  fp_[0] = (fp_[0] << 32) | (fp_[1] >> 32);
  fp_[1] = (fp_[1] << 32) | ((uint64_t)v);
  return out;
}

template <>
inline uint64_t Fingerprint<128>::shlor64(uint64_t v) {
  uint64_t out = fp_[0];
  fp_[0] = fp_[1];
  fp_[1] = v;
  return out;
}

} // namespace folly
