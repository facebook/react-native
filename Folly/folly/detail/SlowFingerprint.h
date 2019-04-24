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

#pragma once

#include <folly/Fingerprint.h>
#include <folly/Range.h>
#include <folly/detail/FingerprintPolynomial.h>

namespace folly {
namespace detail {

/**
 * Slow, one-bit-at-a-time implementation of the Rabin fingerprint.
 *
 * This is useful as a reference implementation to test the Broder optimization
 * for correctness in the unittest; it's probably too slow for any real use.
 */
template <int BITS>
class SlowFingerprint {
 public:
  SlowFingerprint() : poly_(FingerprintTable<BITS>::poly) {
    // Use the same starting value as Fingerprint, (1 << (BITS-1))
    fp_.addXk(BITS - 1);
  }

  SlowFingerprint& update8(uint8_t v) {
    updateLSB(v, 8);
    return *this;
  }

  SlowFingerprint& update32(uint32_t v) {
    updateLSB(v, 32);
    return *this;
  }

  SlowFingerprint& update64(uint64_t v) {
    updateLSB(v, 64);
    return *this;
  }

  SlowFingerprint& update(const folly::StringPiece str) {
    const char* p = str.start();
    for (int i = str.size(); i != 0; p++, i--) {
      update8(static_cast<uint8_t>(*p));
    }
    return *this;
  }

  void write(uint64_t* out) const {
    for (int i = 0; i < fp_.size(); ++i) {
      out[i] = fp_.get(i);
    }
  }

 private:
  void updateBit(bool bit) {
    fp_.mulXmod(poly_);
    if (bit) {
      fp_.addXk(0);
    }
  }

  void updateLSB(uint64_t val, int bits) {
    val <<= (64 - bits);
    for (; bits != 0; --bits) {
      updateBit(val & (1ULL << 63));
      val <<= 1;
    }
  }

  const FingerprintPolynomial<BITS - 1> poly_;
  FingerprintPolynomial<BITS - 1> fp_;
};

} // namespace detail
} // namespace folly
