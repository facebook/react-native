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

#include <cstdint>

namespace folly {
namespace detail {

/**
 * Representation of a polynomial of degree DEG over GF(2) (that is,
 * with binary coefficients).
 *
 * Probably of no use outside of Fingerprint code; used by
 * GenerateFingerprintTables and the unittest.
 */
template <int DEG>
class FingerprintPolynomial {
 public:
  static constexpr int size() {
    return 1 + DEG / 64;
  }

  constexpr FingerprintPolynomial() {}

  constexpr explicit FingerprintPolynomial(const uint64_t (&vals)[size()]) {
    for (int i = 0; i < size(); i++) {
      val_[i] = vals[i];
    }
  }

  constexpr uint64_t get(size_t i) const {
    return val_[i];
  }

  constexpr void add(const FingerprintPolynomial<DEG>& other) {
    for (int i = 0; i < size(); i++) {
      val_[i] ^= other.val_[i];
    }
  }

  // Multiply by X.  The actual degree must be < DEG.
  constexpr void mulX() {
    uint64_t b = 0;
    for (int i = size() - 1; i >= 0; i--) {
      uint64_t nb = val_[i] >> 63;
      val_[i] = (val_[i] << 1) | b;
      b = nb;
    }
  }

  // Compute (this * X) mod P(X), where P(X) is a monic polynomial of degree
  // DEG+1 (represented as a FingerprintPolynomial<DEG> object, with the
  // implicit coefficient of X^(DEG+1)==1)
  //
  // This is a bit tricky. If k=DEG+1:
  // Let P(X) = X^k + p_(k-1) * X^(k-1) + ... + p_1 * X + p_0
  // Let this = A(X) = a_(k-1) * X^(k-1) + ... + a_1 * X + a_0
  // Then:
  //   A(X) * X
  // = a_(k-1) * X^k + (a_(k-2) * X^(k-1) + ... + a_1 * X^2 + a_0 * X)
  // = a_(k-1) * X^k + (the binary representation of A, left shift by 1)
  //
  // if a_(k-1) = 0, we can ignore the first term.
  // if a_(k-1) = 1, then:
  //   X^k mod P(X)
  // = X^k - P(X)
  // = P(X) - X^k
  // = p_(k-1) * X^(k-1) + ... + p_1 * X + p_0
  // = exactly the binary representation passed in as an argument to this
  //   function!
  //
  // So A(X) * X mod P(X) is:
  //   the binary representation of A, left shift by 1,
  //   XOR p if a_(k-1) == 1
  constexpr void mulXmod(const FingerprintPolynomial<DEG>& p) {
    bool needXOR = (val_[0] & (1ULL << 63));
    val_[0] &= ~(1ULL << 63);
    mulX();
    if (needXOR) {
      add(p);
    }
  }

  // Compute (this * X^k) mod P(X) by repeatedly multiplying by X (see above)
  constexpr void mulXkmod(int k, const FingerprintPolynomial<DEG>& p) {
    for (int i = 0; i < k; i++) {
      mulXmod(p);
    }
  }

  // add X^k, where k <= DEG
  constexpr void addXk(int k) {
    int word_offset = (DEG - k) / 64;
    int bit_offset = 63 - (DEG - k) % 64;
    val_[word_offset] ^= (1ULL << bit_offset);
  }

  // Set the highest 8 bits to val.
  // If val is interpreted as polynomial of degree 7, then this sets *this
  // to val * X^(DEG-7)
  constexpr void setHigh8Bits(uint8_t val) {
    val_[0] = ((uint64_t)val) << (64 - 8);
    for (int i = 1; i < size(); i++) {
      val_[i] = 0;
    }
  }

 private:
  // Internal representation: big endian
  // val_[0] contains the highest order coefficients, with bit 63 as the
  // highest order coefficient
  //
  // If DEG+1 is not a multiple of 64,  val_[size()-1] only uses the highest
  // order (DEG+1)%64 bits (the others are always 0)
  uint64_t val_[size()] = {};
};

} // namespace detail
} // namespace folly
