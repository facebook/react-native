// Copyright 2012 the V8 project authors. All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
//       copyright notice, this list of conditions and the following
//       disclaimer in the documentation and/or other materials provided
//       with the distribution.
//     * Neither the name of Google Inc. nor the names of its
//       contributors may be used to endorse or promote products derived
//       from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

#ifndef DOUBLE_CONVERSION_DOUBLE_H_
#define DOUBLE_CONVERSION_DOUBLE_H_

#include <double-conversion/diy-fp.h>

namespace double_conversion {

// We assume that doubles and uint64_t have the same endianness.
static uint64_t double_to_uint64(double d) { return BitCast<uint64_t>(d); }
static double uint64_to_double(uint64_t d64) { return BitCast<double>(d64); }
static uint32_t float_to_uint32(float f) { return BitCast<uint32_t>(f); }
static float uint32_to_float(uint32_t d32) { return BitCast<float>(d32); }

// Helper functions for doubles.
class Double {
 public:
  static const uint64_t kSignMask = UINT64_2PART_C(0x80000000, 00000000);
  static const uint64_t kExponentMask = UINT64_2PART_C(0x7FF00000, 00000000);
  static const uint64_t kSignificandMask = UINT64_2PART_C(0x000FFFFF, FFFFFFFF);
  static const uint64_t kHiddenBit = UINT64_2PART_C(0x00100000, 00000000);
  static const int kPhysicalSignificandSize = 52;  // Excludes the hidden bit.
  static const int kSignificandSize = 53;

  Double() : d64_(0) {}
  explicit Double(double d) : d64_(double_to_uint64(d)) {}
  explicit Double(uint64_t d64) : d64_(d64) {}
  explicit Double(DiyFp diy_fp)
    : d64_(DiyFpToUint64(diy_fp)) {}

  // The value encoded by this Double must be greater or equal to +0.0.
  // It must not be special (infinity, or NaN).
  DiyFp AsDiyFp() const {
    ASSERT(Sign() > 0);
    ASSERT(!IsSpecial());
    return DiyFp(Significand(), Exponent());
  }

  // The value encoded by this Double must be strictly greater than 0.
  DiyFp AsNormalizedDiyFp() const {
    ASSERT(value() > 0.0);
    uint64_t f = Significand();
    int e = Exponent();

    // The current double could be a denormal.
    while ((f & kHiddenBit) == 0) {
      f <<= 1;
      e--;
    }
    // Do the final shifts in one go.
    f <<= DiyFp::kSignificandSize - kSignificandSize;
    e -= DiyFp::kSignificandSize - kSignificandSize;
    return DiyFp(f, e);
  }

  // Returns the double's bit as uint64.
  uint64_t AsUint64() const {
    return d64_;
  }

  // Returns the next greater double. Returns +infinity on input +infinity.
  double NextDouble() const {
    if (d64_ == kInfinity) return Double(kInfinity).value();
    if (Sign() < 0 && Significand() == 0) {
      // -0.0
      return 0.0;
    }
    if (Sign() < 0) {
      return Double(d64_ - 1).value();
    } else {
      return Double(d64_ + 1).value();
    }
  }

  double PreviousDouble() const {
    if (d64_ == (kInfinity | kSignMask)) return -Infinity();
    if (Sign() < 0) {
      return Double(d64_ + 1).value();
    } else {
      if (Significand() == 0) return -0.0;
      return Double(d64_ - 1).value();
    }
  }

  int Exponent() const {
    if (IsDenormal()) return kDenormalExponent;

    uint64_t d64 = AsUint64();
    int biased_e =
        static_cast<int>((d64 & kExponentMask) >> kPhysicalSignificandSize);
    return biased_e - kExponentBias;
  }

  uint64_t Significand() const {
    uint64_t d64 = AsUint64();
    uint64_t significand = d64 & kSignificandMask;
    if (!IsDenormal()) {
      return significand + kHiddenBit;
    } else {
      return significand;
    }
  }

  // Returns true if the double is a denormal.
  bool IsDenormal() const {
    uint64_t d64 = AsUint64();
    return (d64 & kExponentMask) == 0;
  }

  // We consider denormals not to be special.
  // Hence only Infinity and NaN are special.
  bool IsSpecial() const {
    uint64_t d64 = AsUint64();
    return (d64 & kExponentMask) == kExponentMask;
  }

  bool IsNan() const {
    uint64_t d64 = AsUint64();
    return ((d64 & kExponentMask) == kExponentMask) &&
        ((d64 & kSignificandMask) != 0);
  }

  bool IsInfinite() const {
    uint64_t d64 = AsUint64();
    return ((d64 & kExponentMask) == kExponentMask) &&
        ((d64 & kSignificandMask) == 0);
  }

  int Sign() const {
    uint64_t d64 = AsUint64();
    return (d64 & kSignMask) == 0? 1: -1;
  }

  // Precondition: the value encoded by this Double must be greater or equal
  // than +0.0.
  DiyFp UpperBoundary() const {
    ASSERT(Sign() > 0);
    return DiyFp(Significand() * 2 + 1, Exponent() - 1);
  }

  // Computes the two boundaries of this.
  // The bigger boundary (m_plus) is normalized. The lower boundary has the same
  // exponent as m_plus.
  // Precondition: the value encoded by this Double must be greater than 0.
  void NormalizedBoundaries(DiyFp* out_m_minus, DiyFp* out_m_plus) const {
    ASSERT(value() > 0.0);
    DiyFp v = this->AsDiyFp();
    DiyFp m_plus = DiyFp::Normalize(DiyFp((v.f() << 1) + 1, v.e() - 1));
    DiyFp m_minus;
    if (LowerBoundaryIsCloser()) {
      m_minus = DiyFp((v.f() << 2) - 1, v.e() - 2);
    } else {
      m_minus = DiyFp((v.f() << 1) - 1, v.e() - 1);
    }
    m_minus.set_f(m_minus.f() << (m_minus.e() - m_plus.e()));
    m_minus.set_e(m_plus.e());
    *out_m_plus = m_plus;
    *out_m_minus = m_minus;
  }

  bool LowerBoundaryIsCloser() const {
    // The boundary is closer if the significand is of the form f == 2^p-1 then
    // the lower boundary is closer.
    // Think of v = 1000e10 and v- = 9999e9.
    // Then the boundary (== (v - v-)/2) is not just at a distance of 1e9 but
    // at a distance of 1e8.
    // The only exception is for the smallest normal: the largest denormal is
    // at the same distance as its successor.
    // Note: denormals have the same exponent as the smallest normals.
    bool physical_significand_is_zero = ((AsUint64() & kSignificandMask) == 0);
    return physical_significand_is_zero && (Exponent() != kDenormalExponent);
  }

  double value() const { return uint64_to_double(d64_); }

  // Returns the significand size for a given order of magnitude.
  // If v = f*2^e with 2^p-1 <= f <= 2^p then p+e is v's order of magnitude.
  // This function returns the number of significant binary digits v will have
  // once it's encoded into a double. In almost all cases this is equal to
  // kSignificandSize. The only exceptions are denormals. They start with
  // leading zeroes and their effective significand-size is hence smaller.
  static int SignificandSizeForOrderOfMagnitude(int order) {
    if (order >= (kDenormalExponent + kSignificandSize)) {
      return kSignificandSize;
    }
    if (order <= kDenormalExponent) return 0;
    return order - kDenormalExponent;
  }

  static double Infinity() {
    return Double(kInfinity).value();
  }

  static double NaN() {
    return Double(kNaN).value();
  }

 private:
  static const int kExponentBias = 0x3FF + kPhysicalSignificandSize;
  static const int kDenormalExponent = -kExponentBias + 1;
  static const int kMaxExponent = 0x7FF - kExponentBias;
  static const uint64_t kInfinity = UINT64_2PART_C(0x7FF00000, 00000000);
  static const uint64_t kNaN = UINT64_2PART_C(0x7FF80000, 00000000);

  const uint64_t d64_;

  static uint64_t DiyFpToUint64(DiyFp diy_fp) {
    uint64_t significand = diy_fp.f();
    int exponent = diy_fp.e();
    while (significand > kHiddenBit + kSignificandMask) {
      significand >>= 1;
      exponent++;
    }
    if (exponent >= kMaxExponent) {
      return kInfinity;
    }
    if (exponent < kDenormalExponent) {
      return 0;
    }
    while (exponent > kDenormalExponent && (significand & kHiddenBit) == 0) {
      significand <<= 1;
      exponent--;
    }
    uint64_t biased_exponent;
    if (exponent == kDenormalExponent && (significand & kHiddenBit) == 0) {
      biased_exponent = 0;
    } else {
      biased_exponent = static_cast<uint64_t>(exponent + kExponentBias);
    }
    return (significand & kSignificandMask) |
        (biased_exponent << kPhysicalSignificandSize);
  }

  DC_DISALLOW_COPY_AND_ASSIGN(Double);
};

class Single {
 public:
  static const uint32_t kSignMask = 0x80000000;
  static const uint32_t kExponentMask = 0x7F800000;
  static const uint32_t kSignificandMask = 0x007FFFFF;
  static const uint32_t kHiddenBit = 0x00800000;
  static const int kPhysicalSignificandSize = 23;  // Excludes the hidden bit.
  static const int kSignificandSize = 24;

  Single() : d32_(0) {}
  explicit Single(float f) : d32_(float_to_uint32(f)) {}
  explicit Single(uint32_t d32) : d32_(d32) {}

  // The value encoded by this Single must be greater or equal to +0.0.
  // It must not be special (infinity, or NaN).
  DiyFp AsDiyFp() const {
    ASSERT(Sign() > 0);
    ASSERT(!IsSpecial());
    return DiyFp(Significand(), Exponent());
  }

  // Returns the single's bit as uint64.
  uint32_t AsUint32() const {
    return d32_;
  }

  int Exponent() const {
    if (IsDenormal()) return kDenormalExponent;

    uint32_t d32 = AsUint32();
    int biased_e =
        static_cast<int>((d32 & kExponentMask) >> kPhysicalSignificandSize);
    return biased_e - kExponentBias;
  }

  uint32_t Significand() const {
    uint32_t d32 = AsUint32();
    uint32_t significand = d32 & kSignificandMask;
    if (!IsDenormal()) {
      return significand + kHiddenBit;
    } else {
      return significand;
    }
  }

  // Returns true if the single is a denormal.
  bool IsDenormal() const {
    uint32_t d32 = AsUint32();
    return (d32 & kExponentMask) == 0;
  }

  // We consider denormals not to be special.
  // Hence only Infinity and NaN are special.
  bool IsSpecial() const {
    uint32_t d32 = AsUint32();
    return (d32 & kExponentMask) == kExponentMask;
  }

  bool IsNan() const {
    uint32_t d32 = AsUint32();
    return ((d32 & kExponentMask) == kExponentMask) &&
        ((d32 & kSignificandMask) != 0);
  }

  bool IsInfinite() const {
    uint32_t d32 = AsUint32();
    return ((d32 & kExponentMask) == kExponentMask) &&
        ((d32 & kSignificandMask) == 0);
  }

  int Sign() const {
    uint32_t d32 = AsUint32();
    return (d32 & kSignMask) == 0? 1: -1;
  }

  // Computes the two boundaries of this.
  // The bigger boundary (m_plus) is normalized. The lower boundary has the same
  // exponent as m_plus.
  // Precondition: the value encoded by this Single must be greater than 0.
  void NormalizedBoundaries(DiyFp* out_m_minus, DiyFp* out_m_plus) const {
    ASSERT(value() > 0.0);
    DiyFp v = this->AsDiyFp();
    DiyFp m_plus = DiyFp::Normalize(DiyFp((v.f() << 1) + 1, v.e() - 1));
    DiyFp m_minus;
    if (LowerBoundaryIsCloser()) {
      m_minus = DiyFp((v.f() << 2) - 1, v.e() - 2);
    } else {
      m_minus = DiyFp((v.f() << 1) - 1, v.e() - 1);
    }
    m_minus.set_f(m_minus.f() << (m_minus.e() - m_plus.e()));
    m_minus.set_e(m_plus.e());
    *out_m_plus = m_plus;
    *out_m_minus = m_minus;
  }

  // Precondition: the value encoded by this Single must be greater or equal
  // than +0.0.
  DiyFp UpperBoundary() const {
    ASSERT(Sign() > 0);
    return DiyFp(Significand() * 2 + 1, Exponent() - 1);
  }

  bool LowerBoundaryIsCloser() const {
    // The boundary is closer if the significand is of the form f == 2^p-1 then
    // the lower boundary is closer.
    // Think of v = 1000e10 and v- = 9999e9.
    // Then the boundary (== (v - v-)/2) is not just at a distance of 1e9 but
    // at a distance of 1e8.
    // The only exception is for the smallest normal: the largest denormal is
    // at the same distance as its successor.
    // Note: denormals have the same exponent as the smallest normals.
    bool physical_significand_is_zero = ((AsUint32() & kSignificandMask) == 0);
    return physical_significand_is_zero && (Exponent() != kDenormalExponent);
  }

  float value() const { return uint32_to_float(d32_); }

  static float Infinity() {
    return Single(kInfinity).value();
  }

  static float NaN() {
    return Single(kNaN).value();
  }

 private:
  static const int kExponentBias = 0x7F + kPhysicalSignificandSize;
  static const int kDenormalExponent = -kExponentBias + 1;
  static const int kMaxExponent = 0xFF - kExponentBias;
  static const uint32_t kInfinity = 0x7F800000;
  static const uint32_t kNaN = 0x7FC00000;

  const uint32_t d32_;

  DC_DISALLOW_COPY_AND_ASSIGN(Single);
};

}  // namespace double_conversion

#endif  // DOUBLE_CONVERSION_DOUBLE_H_
