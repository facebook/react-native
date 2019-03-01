// Copyright 2006-2008 the V8 project authors. All rights reserved.

#include <stdlib.h>

#include "cctest.h"
#include "double-conversion/diy-fp.h"
#include "double-conversion/utils.h"
#include "double-conversion/ieee.h"


using namespace double_conversion;


TEST(Uint64Conversions) {
  // Start by checking the byte-order.
  uint64_t ordered = UINT64_2PART_C(0x01234567, 89ABCDEF);
  CHECK_EQ(3512700564088504e-318, Double(ordered).value());

  uint64_t min_double64 = UINT64_2PART_C(0x00000000, 00000001);
  CHECK_EQ(5e-324, Double(min_double64).value());

  uint64_t max_double64 = UINT64_2PART_C(0x7fefffff, ffffffff);
  CHECK_EQ(1.7976931348623157e308, Double(max_double64).value());
}


TEST(Uint32Conversions) {
  // Start by checking the byte-order.
  uint32_t ordered = 0x01234567;
  CHECK_EQ(2.9988165487136453e-38f, Single(ordered).value());

  uint32_t min_float32 = 0x00000001;
  CHECK_EQ(1.4e-45f, Single(min_float32).value());

  uint32_t max_float32 = 0x7f7fffff;
  CHECK_EQ(3.4028234e38f, Single(max_float32).value());
}


TEST(Double_AsDiyFp) {
  uint64_t ordered = UINT64_2PART_C(0x01234567, 89ABCDEF);
  DiyFp diy_fp = Double(ordered).AsDiyFp();
  CHECK_EQ(0x12 - 0x3FF - 52, diy_fp.e());
  // The 52 mantissa bits, plus the implicit 1 in bit 52 as a UINT64.
  CHECK(UINT64_2PART_C(0x00134567, 89ABCDEF) == diy_fp.f());  // NOLINT

  uint64_t min_double64 = UINT64_2PART_C(0x00000000, 00000001);
  diy_fp = Double(min_double64).AsDiyFp();
  CHECK_EQ(-0x3FF - 52 + 1, diy_fp.e());
  // This is a denormal; so no hidden bit.
  CHECK(1 == diy_fp.f());  // NOLINT

  uint64_t max_double64 = UINT64_2PART_C(0x7fefffff, ffffffff);
  diy_fp = Double(max_double64).AsDiyFp();
  CHECK_EQ(0x7FE - 0x3FF - 52, diy_fp.e());
  CHECK(UINT64_2PART_C(0x001fffff, ffffffff) == diy_fp.f());  // NOLINT
}


TEST(Single_AsDiyFp) {
  uint32_t ordered = 0x01234567;
  DiyFp diy_fp = Single(ordered).AsDiyFp();
  CHECK_EQ(0x2 - 0x7F - 23, diy_fp.e());
  // The 23 mantissa bits, plus the implicit 1 in bit 24 as a uint32_t.
  CHECK_EQ(0xA34567, diy_fp.f());

  uint32_t min_float32 = 0x00000001;
  diy_fp = Single(min_float32).AsDiyFp();
  CHECK_EQ(-0x7F - 23 + 1, diy_fp.e());
  // This is a denormal; so no hidden bit.
  CHECK_EQ(1, diy_fp.f());

  uint32_t max_float32 = 0x7f7fffff;
  diy_fp = Single(max_float32).AsDiyFp();
  CHECK_EQ(0xFE - 0x7F - 23, diy_fp.e());
  CHECK_EQ(0x00ffffff, diy_fp.f());
}


TEST(AsNormalizedDiyFp) {
  uint64_t ordered = UINT64_2PART_C(0x01234567, 89ABCDEF);
  DiyFp diy_fp = Double(ordered).AsNormalizedDiyFp();
  CHECK_EQ(0x12 - 0x3FF - 52 - 11, diy_fp.e());
  CHECK((UINT64_2PART_C(0x00134567, 89ABCDEF) << 11) ==
        diy_fp.f());  // NOLINT

  uint64_t min_double64 = UINT64_2PART_C(0x00000000, 00000001);
  diy_fp = Double(min_double64).AsNormalizedDiyFp();
  CHECK_EQ(-0x3FF - 52 + 1 - 63, diy_fp.e());
  // This is a denormal; so no hidden bit.
  CHECK(UINT64_2PART_C(0x80000000, 00000000) == diy_fp.f());  // NOLINT

  uint64_t max_double64 = UINT64_2PART_C(0x7fefffff, ffffffff);
  diy_fp = Double(max_double64).AsNormalizedDiyFp();
  CHECK_EQ(0x7FE - 0x3FF - 52 - 11, diy_fp.e());
  CHECK((UINT64_2PART_C(0x001fffff, ffffffff) << 11) ==
        diy_fp.f());  // NOLINT
}


TEST(Double_IsDenormal) {
  uint64_t min_double64 = UINT64_2PART_C(0x00000000, 00000001);
  CHECK(Double(min_double64).IsDenormal());
  uint64_t bits = UINT64_2PART_C(0x000FFFFF, FFFFFFFF);
  CHECK(Double(bits).IsDenormal());
  bits = UINT64_2PART_C(0x00100000, 00000000);
  CHECK(!Double(bits).IsDenormal());
}


TEST(Single_IsDenormal) {
  uint32_t min_float32 = 0x00000001;
  CHECK(Single(min_float32).IsDenormal());
  uint32_t bits = 0x007FFFFF;
  CHECK(Single(bits).IsDenormal());
  bits = 0x00800000;
  CHECK(!Single(bits).IsDenormal());
}


TEST(Double_IsSpecial) {
  CHECK(Double(Double::Infinity()).IsSpecial());
  CHECK(Double(-Double::Infinity()).IsSpecial());
  CHECK(Double(Double::NaN()).IsSpecial());
  uint64_t bits = UINT64_2PART_C(0xFFF12345, 00000000);
  CHECK(Double(bits).IsSpecial());
  // Denormals are not special:
  CHECK(!Double(5e-324).IsSpecial());
  CHECK(!Double(-5e-324).IsSpecial());
  // And some random numbers:
  CHECK(!Double(0.0).IsSpecial());
  CHECK(!Double(-0.0).IsSpecial());
  CHECK(!Double(1.0).IsSpecial());
  CHECK(!Double(-1.0).IsSpecial());
  CHECK(!Double(1000000.0).IsSpecial());
  CHECK(!Double(-1000000.0).IsSpecial());
  CHECK(!Double(1e23).IsSpecial());
  CHECK(!Double(-1e23).IsSpecial());
  CHECK(!Double(1.7976931348623157e308).IsSpecial());
  CHECK(!Double(-1.7976931348623157e308).IsSpecial());
}


TEST(Single_IsSpecial) {
  CHECK(Single(Single::Infinity()).IsSpecial());
  CHECK(Single(-Single::Infinity()).IsSpecial());
  CHECK(Single(Single::NaN()).IsSpecial());
  uint32_t bits = 0xFFF12345;
  CHECK(Single(bits).IsSpecial());
  // Denormals are not special:
  CHECK(!Single(1.4e-45f).IsSpecial());
  CHECK(!Single(-1.4e-45f).IsSpecial());
  // And some random numbers:
  CHECK(!Single(0.0f).IsSpecial());
  CHECK(!Single(-0.0f).IsSpecial());
  CHECK(!Single(1.0f).IsSpecial());
  CHECK(!Single(-1.0f).IsSpecial());
  CHECK(!Single(1000000.0f).IsSpecial());
  CHECK(!Single(-1000000.0f).IsSpecial());
  CHECK(!Single(1e23f).IsSpecial());
  CHECK(!Single(-1e23f).IsSpecial());
  CHECK(!Single(1.18e-38f).IsSpecial());
  CHECK(!Single(-1.18e-38f).IsSpecial());
}


TEST(Double_IsInfinite) {
  CHECK(Double(Double::Infinity()).IsInfinite());
  CHECK(Double(-Double::Infinity()).IsInfinite());
  CHECK(!Double(Double::NaN()).IsInfinite());
  CHECK(!Double(0.0).IsInfinite());
  CHECK(!Double(-0.0).IsInfinite());
  CHECK(!Double(1.0).IsInfinite());
  CHECK(!Double(-1.0).IsInfinite());
  uint64_t min_double64 = UINT64_2PART_C(0x00000000, 00000001);
  CHECK(!Double(min_double64).IsInfinite());
}


TEST(Single_IsInfinite) {
  CHECK(Single(Single::Infinity()).IsInfinite());
  CHECK(Single(-Single::Infinity()).IsInfinite());
  CHECK(!Single(Single::NaN()).IsInfinite());
  CHECK(!Single(0.0f).IsInfinite());
  CHECK(!Single(-0.0f).IsInfinite());
  CHECK(!Single(1.0f).IsInfinite());
  CHECK(!Single(-1.0f).IsInfinite());
  uint32_t min_float32 = 0x00000001;
  CHECK(!Single(min_float32).IsInfinite());
}


TEST(Double_IsNan) {
  CHECK(Double(Double::NaN()).IsNan());
  uint64_t other_nan = UINT64_2PART_C(0xFFFFFFFF, 00000001);
  CHECK(Double(other_nan).IsNan());
  CHECK(!Double(Double::Infinity()).IsNan());
  CHECK(!Double(-Double::Infinity()).IsNan());
  CHECK(!Double(0.0).IsNan());
  CHECK(!Double(-0.0).IsNan());
  CHECK(!Double(1.0).IsNan());
  CHECK(!Double(-1.0).IsNan());
  uint64_t min_double64 = UINT64_2PART_C(0x00000000, 00000001);
  CHECK(!Double(min_double64).IsNan());
}


TEST(Single_IsNan) {
  CHECK(Single(Single::NaN()).IsNan());
  uint32_t other_nan = 0xFFFFF001;
  CHECK(Single(other_nan).IsNan());
  CHECK(!Single(Single::Infinity()).IsNan());
  CHECK(!Single(-Single::Infinity()).IsNan());
  CHECK(!Single(0.0f).IsNan());
  CHECK(!Single(-0.0f).IsNan());
  CHECK(!Single(1.0f).IsNan());
  CHECK(!Single(-1.0f).IsNan());
  uint32_t min_float32 = 0x00000001;
  CHECK(!Single(min_float32).IsNan());
}


TEST(Double_Sign) {
  CHECK_EQ(1, Double(1.0).Sign());
  CHECK_EQ(1, Double(Double::Infinity()).Sign());
  CHECK_EQ(-1, Double(-Double::Infinity()).Sign());
  CHECK_EQ(1, Double(0.0).Sign());
  CHECK_EQ(-1, Double(-0.0).Sign());
  uint64_t min_double64 = UINT64_2PART_C(0x00000000, 00000001);
  CHECK_EQ(1, Double(min_double64).Sign());
}


TEST(Single_Sign) {
  CHECK_EQ(1, Single(1.0f).Sign());
  CHECK_EQ(1, Single(Single::Infinity()).Sign());
  CHECK_EQ(-1, Single(-Single::Infinity()).Sign());
  CHECK_EQ(1, Single(0.0f).Sign());
  CHECK_EQ(-1, Single(-0.0f).Sign());
  uint32_t min_float32 = 0x00000001;
  CHECK_EQ(1, Single(min_float32).Sign());
}


TEST(Double_NormalizedBoundaries) {
  DiyFp boundary_plus;
  DiyFp boundary_minus;
  DiyFp diy_fp = Double(1.5).AsNormalizedDiyFp();
  Double(1.5).NormalizedBoundaries(&boundary_minus, &boundary_plus);
  CHECK_EQ(diy_fp.e(), boundary_minus.e());
  CHECK_EQ(diy_fp.e(), boundary_plus.e());
  // 1.5 does not have a significand of the form 2^p (for some p).
  // Therefore its boundaries are at the same distance.
  CHECK(diy_fp.f() - boundary_minus.f() == boundary_plus.f() - diy_fp.f());
  CHECK((1 << 10) == diy_fp.f() - boundary_minus.f());  // NOLINT

  diy_fp = Double(1.0).AsNormalizedDiyFp();
  Double(1.0).NormalizedBoundaries(&boundary_minus, &boundary_plus);
  CHECK_EQ(diy_fp.e(), boundary_minus.e());
  CHECK_EQ(diy_fp.e(), boundary_plus.e());
  // 1.0 does have a significand of the form 2^p (for some p).
  // Therefore its lower boundary is twice as close as the upper boundary.
  CHECK(boundary_plus.f() - diy_fp.f() > diy_fp.f() - boundary_minus.f());
  CHECK((1 << 9) == diy_fp.f() - boundary_minus.f());  // NOLINT
  CHECK((1 << 10) == boundary_plus.f() - diy_fp.f());  // NOLINT

  uint64_t min_double64 = UINT64_2PART_C(0x00000000, 00000001);
  diy_fp = Double(min_double64).AsNormalizedDiyFp();
  Double(min_double64).NormalizedBoundaries(&boundary_minus, &boundary_plus);
  CHECK_EQ(diy_fp.e(), boundary_minus.e());
  CHECK_EQ(diy_fp.e(), boundary_plus.e());
  // min-value does not have a significand of the form 2^p (for some p).
  // Therefore its boundaries are at the same distance.
  CHECK(diy_fp.f() - boundary_minus.f() == boundary_plus.f() - diy_fp.f());
  // Denormals have their boundaries much closer.
  CHECK((static_cast<uint64_t>(1) << 62) ==
        diy_fp.f() - boundary_minus.f());  // NOLINT

  uint64_t smallest_normal64 = UINT64_2PART_C(0x00100000, 00000000);
  diy_fp = Double(smallest_normal64).AsNormalizedDiyFp();
  Double(smallest_normal64).NormalizedBoundaries(&boundary_minus,
                                                 &boundary_plus);
  CHECK_EQ(diy_fp.e(), boundary_minus.e());
  CHECK_EQ(diy_fp.e(), boundary_plus.e());
  // Even though the significand is of the form 2^p (for some p), its boundaries
  // are at the same distance. (This is the only exception).
  CHECK(diy_fp.f() - boundary_minus.f() == boundary_plus.f() - diy_fp.f());
  CHECK((1 << 10) == diy_fp.f() - boundary_minus.f());  // NOLINT

  uint64_t largest_denormal64 = UINT64_2PART_C(0x000FFFFF, FFFFFFFF);
  diy_fp = Double(largest_denormal64).AsNormalizedDiyFp();
  Double(largest_denormal64).NormalizedBoundaries(&boundary_minus,
                                                  &boundary_plus);
  CHECK_EQ(diy_fp.e(), boundary_minus.e());
  CHECK_EQ(diy_fp.e(), boundary_plus.e());
  CHECK(diy_fp.f() - boundary_minus.f() == boundary_plus.f() - diy_fp.f());
  CHECK((1 << 11) == diy_fp.f() - boundary_minus.f());  // NOLINT

  uint64_t max_double64 = UINT64_2PART_C(0x7fefffff, ffffffff);
  diy_fp = Double(max_double64).AsNormalizedDiyFp();
  Double(max_double64).NormalizedBoundaries(&boundary_minus, &boundary_plus);
  CHECK_EQ(diy_fp.e(), boundary_minus.e());
  CHECK_EQ(diy_fp.e(), boundary_plus.e());
  // max-value does not have a significand of the form 2^p (for some p).
  // Therefore its boundaries are at the same distance.
  CHECK(diy_fp.f() - boundary_minus.f() == boundary_plus.f() - diy_fp.f());
  CHECK((1 << 10) == diy_fp.f() - boundary_minus.f());  // NOLINT
}


TEST(Single_NormalizedBoundaries) {
  uint64_t kOne64 = 1;
  DiyFp boundary_plus;
  DiyFp boundary_minus;
  DiyFp diy_fp = Single(1.5f).AsDiyFp();
  diy_fp.Normalize();
  Single(1.5f).NormalizedBoundaries(&boundary_minus, &boundary_plus);
  CHECK_EQ(diy_fp.e(), boundary_minus.e());
  CHECK_EQ(diy_fp.e(), boundary_plus.e());
  // 1.5 does not have a significand of the form 2^p (for some p).
  // Therefore its boundaries are at the same distance.
  CHECK(diy_fp.f() - boundary_minus.f() == boundary_plus.f() - diy_fp.f());
  // Normalization shifts the significand by 8 bits. Add 32 bits for the bigger
  // data-type, and remove 1 because boundaries are at half a ULP.
  CHECK((kOne64 << 39) == diy_fp.f() - boundary_minus.f());

  diy_fp = Single(1.0f).AsDiyFp();
  diy_fp.Normalize();
  Single(1.0f).NormalizedBoundaries(&boundary_minus, &boundary_plus);
  CHECK_EQ(diy_fp.e(), boundary_minus.e());
  CHECK_EQ(diy_fp.e(), boundary_plus.e());
  // 1.0 does have a significand of the form 2^p (for some p).
  // Therefore its lower boundary is twice as close as the upper boundary.
  CHECK(boundary_plus.f() - diy_fp.f() > diy_fp.f() - boundary_minus.f());
  CHECK((kOne64 << 38) == diy_fp.f() - boundary_minus.f());  // NOLINT
  CHECK((kOne64 << 39) == boundary_plus.f() - diy_fp.f());  // NOLINT

  uint32_t min_float32 = 0x00000001;
  diy_fp = Single(min_float32).AsDiyFp();
  diy_fp.Normalize();
  Single(min_float32).NormalizedBoundaries(&boundary_minus, &boundary_plus);
  CHECK_EQ(diy_fp.e(), boundary_minus.e());
  CHECK_EQ(diy_fp.e(), boundary_plus.e());
  // min-value does not have a significand of the form 2^p (for some p).
  // Therefore its boundaries are at the same distance.
  CHECK(diy_fp.f() - boundary_minus.f() == boundary_plus.f() - diy_fp.f());
  // Denormals have their boundaries much closer.
  CHECK((kOne64 << 62) == diy_fp.f() - boundary_minus.f());  // NOLINT

  uint32_t smallest_normal32 = 0x00800000;
  diy_fp = Single(smallest_normal32).AsDiyFp();
  diy_fp.Normalize();
  Single(smallest_normal32).NormalizedBoundaries(&boundary_minus,
                                                 &boundary_plus);
  CHECK_EQ(diy_fp.e(), boundary_minus.e());
  CHECK_EQ(diy_fp.e(), boundary_plus.e());
  // Even though the significand is of the form 2^p (for some p), its boundaries
  // are at the same distance. (This is the only exception).
  CHECK(diy_fp.f() - boundary_minus.f() == boundary_plus.f() - diy_fp.f());
  CHECK((kOne64 << 39) == diy_fp.f() - boundary_minus.f());  // NOLINT

  uint32_t largest_denormal32 = 0x007FFFFF;
  diy_fp = Single(largest_denormal32).AsDiyFp();
  diy_fp.Normalize();
  Single(largest_denormal32).NormalizedBoundaries(&boundary_minus,
                                                  &boundary_plus);
  CHECK_EQ(diy_fp.e(), boundary_minus.e());
  CHECK_EQ(diy_fp.e(), boundary_plus.e());
  CHECK(diy_fp.f() - boundary_minus.f() == boundary_plus.f() - diy_fp.f());
  CHECK((kOne64 << 40) == diy_fp.f() - boundary_minus.f());  // NOLINT

  uint32_t max_float32 = 0x7f7fffff;
  diy_fp = Single(max_float32).AsDiyFp();
  diy_fp.Normalize();
  Single(max_float32).NormalizedBoundaries(&boundary_minus, &boundary_plus);
  CHECK_EQ(diy_fp.e(), boundary_minus.e());
  CHECK_EQ(diy_fp.e(), boundary_plus.e());
  // max-value does not have a significand of the form 2^p (for some p).
  // Therefore its boundaries are at the same distance.
  CHECK(diy_fp.f() - boundary_minus.f() == boundary_plus.f() - diy_fp.f());
  CHECK((kOne64 << 39) == diy_fp.f() - boundary_minus.f());  // NOLINT
}


TEST(NextDouble) {
  CHECK_EQ(4e-324, Double(0.0).NextDouble());
  CHECK_EQ(0.0, Double(-0.0).NextDouble());
  CHECK_EQ(-0.0, Double(-4e-324).NextDouble());
  CHECK(Double(Double(-0.0).NextDouble()).Sign() > 0);
  CHECK(Double(Double(-4e-324).NextDouble()).Sign() < 0);
  Double d0(-4e-324);
  Double d1(d0.NextDouble());
  Double d2(d1.NextDouble());
  CHECK_EQ(-0.0, d1.value());
  CHECK(d1.Sign() < 0);
  CHECK_EQ(0.0, d2.value());
  CHECK(d2.Sign() > 0);
  CHECK_EQ(4e-324, d2.NextDouble());
  CHECK_EQ(-1.7976931348623157e308, Double(-Double::Infinity()).NextDouble());
  CHECK_EQ(Double::Infinity(),
           Double(UINT64_2PART_C(0x7fefffff, ffffffff)).NextDouble());
}


TEST(PreviousDouble) {
  CHECK_EQ(0.0, Double(4e-324).PreviousDouble());
  CHECK_EQ(-0.0, Double(0.0).PreviousDouble());
  CHECK(Double(Double(0.0).PreviousDouble()).Sign() < 0);
  CHECK_EQ(-4e-324, Double(-0.0).PreviousDouble());
  Double d0(4e-324);
  Double d1(d0.PreviousDouble());
  Double d2(d1.PreviousDouble());
  CHECK_EQ(0.0, d1.value());
  CHECK(d1.Sign() > 0);
  CHECK_EQ(-0.0, d2.value());
  CHECK(d2.Sign() < 0);
  CHECK_EQ(-4e-324, d2.PreviousDouble());
  CHECK_EQ(1.7976931348623157e308, Double(Double::Infinity()).PreviousDouble());
  CHECK_EQ(-Double::Infinity(),
           Double(UINT64_2PART_C(0xffefffff, ffffffff)).PreviousDouble());
}
