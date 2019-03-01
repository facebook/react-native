// Copyright 2012 the V8 project authors. All rights reserved.

#include <string.h>

#include "cctest.h"
#include "double-conversion/double-conversion.h"
#include "double-conversion/ieee.h"
#include "double-conversion/utils.h"

// DoubleToString is already tested in test-dtoa.cc.

using namespace double_conversion;


TEST(DoubleToShortest) {
  const int kBufferSize = 128;
  char buffer[kBufferSize];
  StringBuilder builder(buffer, kBufferSize);
  int flags = DoubleToStringConverter::UNIQUE_ZERO |
      DoubleToStringConverter::EMIT_POSITIVE_EXPONENT_SIGN;
  DoubleToStringConverter dc(flags, NULL, NULL, 'e', -6, 21, 0, 0);

  CHECK(dc.ToShortest(0.0, &builder));
  CHECK_EQ("0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(12345.0, &builder));
  CHECK_EQ("12345", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(12345e23, &builder));
  CHECK_EQ("1.2345e+27", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(1e21, &builder));
  CHECK_EQ("1e+21", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(1e20, &builder));
  CHECK_EQ("100000000000000000000", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(111111111111111111111.0, &builder));
  CHECK_EQ("111111111111111110000", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(1111111111111111111111.0, &builder));
  CHECK_EQ("1.1111111111111111e+21", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(11111111111111111111111.0, &builder));
  CHECK_EQ("1.1111111111111111e+22", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(-0.00001, &builder));
  CHECK_EQ("-0.00001", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(-0.000001, &builder));
  CHECK_EQ("-0.000001", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(-0.0000001, &builder));
  CHECK_EQ("-1e-7", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(-0.0, &builder));
  CHECK_EQ("0", builder.Finalize());

  flags = DoubleToStringConverter::NO_FLAGS;
  DoubleToStringConverter dc2(flags, NULL, NULL, 'e', -1, 1, 0, 0);
  builder.Reset();
  CHECK(dc2.ToShortest(0.1, &builder));
  CHECK_EQ("0.1", builder.Finalize());

  builder.Reset();
  CHECK(dc2.ToShortest(0.01, &builder));
  CHECK_EQ("1e-2", builder.Finalize());

  builder.Reset();
  CHECK(dc2.ToShortest(1.0, &builder));
  CHECK_EQ("1", builder.Finalize());

  builder.Reset();
  CHECK(dc2.ToShortest(10.0, &builder));
  CHECK_EQ("1e1", builder.Finalize());

  builder.Reset();
  CHECK(dc2.ToShortest(-0.0, &builder));
  CHECK_EQ("-0", builder.Finalize());

  flags = DoubleToStringConverter::EMIT_TRAILING_DECIMAL_POINT |
      DoubleToStringConverter::EMIT_TRAILING_ZERO_AFTER_POINT;
  DoubleToStringConverter dc3(flags, NULL, NULL, 'E', -5, 5, 0, 0);

  builder.Reset();
  CHECK(dc3.ToShortest(0.1, &builder));
  CHECK_EQ("0.1", builder.Finalize());

  builder.Reset();
  CHECK(dc3.ToShortest(1.0, &builder));
  CHECK_EQ("1.0", builder.Finalize());

  builder.Reset();
  CHECK(dc3.ToShortest(10000.0, &builder));
  CHECK_EQ("10000.0", builder.Finalize());

  builder.Reset();
  CHECK(dc3.ToShortest(100000.0, &builder));
  CHECK_EQ("1E5", builder.Finalize());

  // Test the examples in the comments of ToShortest.
  flags = DoubleToStringConverter::EMIT_POSITIVE_EXPONENT_SIGN;
  DoubleToStringConverter dc4(flags, NULL, NULL, 'e', -6, 21, 0, 0);

  builder.Reset();
  CHECK(dc4.ToShortest(0.000001, &builder));
  CHECK_EQ("0.000001", builder.Finalize());

  builder.Reset();
  CHECK(dc4.ToShortest(0.0000001, &builder));
  CHECK_EQ("1e-7", builder.Finalize());

  builder.Reset();
  CHECK(dc4.ToShortest(111111111111111111111.0, &builder));
  CHECK_EQ("111111111111111110000", builder.Finalize());

  builder.Reset();
  CHECK(dc4.ToShortest(100000000000000000000.0, &builder));
  CHECK_EQ("100000000000000000000", builder.Finalize());

  builder.Reset();
  CHECK(dc4.ToShortest(1111111111111111111111.0, &builder));
  CHECK_EQ("1.1111111111111111e+21", builder.Finalize());

  // Test special value handling.
  DoubleToStringConverter dc5(flags, NULL, NULL, 'e', 0, 0, 0, 0);

  builder.Reset();
  CHECK(!dc5.ToShortest(Double::Infinity(), &builder));

  builder.Reset();
  CHECK(!dc5.ToShortest(-Double::Infinity(), &builder));

  builder.Reset();
  CHECK(!dc5.ToShortest(Double::NaN(), &builder));

  builder.Reset();
  CHECK(!dc5.ToShortest(-Double::NaN(), &builder));

  DoubleToStringConverter dc6(flags, "Infinity", "NaN", 'e', 0, 0, 0, 0);

  builder.Reset();
  CHECK(dc6.ToShortest(Double::Infinity(), &builder));
  CHECK_EQ("Infinity", builder.Finalize());

  builder.Reset();
  CHECK(dc6.ToShortest(-Double::Infinity(), &builder));
  CHECK_EQ("-Infinity", builder.Finalize());

  builder.Reset();
  CHECK(dc6.ToShortest(Double::NaN(), &builder));
  CHECK_EQ("NaN", builder.Finalize());

  builder.Reset();
  CHECK(dc6.ToShortest(-Double::NaN(), &builder));
  CHECK_EQ("NaN", builder.Finalize());
}


TEST(DoubleToShortestSingle) {
  const int kBufferSize = 128;
  char buffer[kBufferSize];
  StringBuilder builder(buffer, kBufferSize);
  int flags = DoubleToStringConverter::UNIQUE_ZERO |
      DoubleToStringConverter::EMIT_POSITIVE_EXPONENT_SIGN;
  DoubleToStringConverter dc(flags, NULL, NULL, 'e', -6, 21, 0, 0);

  CHECK(dc.ToShortestSingle(0.0f, &builder));
  CHECK_EQ("0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortestSingle(12345.0f, &builder));
  CHECK_EQ("12345", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortestSingle(12345e23f, &builder));
  CHECK_EQ("1.2345e+27", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortestSingle(1e21f, &builder));
  CHECK_EQ("1e+21", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortestSingle(1e20f, &builder));
  CHECK_EQ("100000000000000000000", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortestSingle(111111111111111111111.0f, &builder));
  CHECK_EQ("111111110000000000000", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortestSingle(1111111111111111111111.0f, &builder));
  CHECK_EQ("1.11111114e+21", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortestSingle(11111111111111111111111.0f, &builder));
  CHECK_EQ("1.1111111e+22", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortestSingle(-0.00001f, &builder));
  CHECK_EQ("-0.00001", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortestSingle(-0.000001f, &builder));
  CHECK_EQ("-0.000001", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortestSingle(-0.0000001f, &builder));
  CHECK_EQ("-1e-7", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortestSingle(-0.0f, &builder));
  CHECK_EQ("0", builder.Finalize());

  flags = DoubleToStringConverter::NO_FLAGS;
  DoubleToStringConverter dc2(flags, NULL, NULL, 'e', -1, 1, 0, 0);
  builder.Reset();
  CHECK(dc2.ToShortestSingle(0.1f, &builder));
  CHECK_EQ("0.1", builder.Finalize());

  builder.Reset();
  CHECK(dc2.ToShortestSingle(0.01f, &builder));
  CHECK_EQ("1e-2", builder.Finalize());

  builder.Reset();
  CHECK(dc2.ToShortestSingle(1.0f, &builder));
  CHECK_EQ("1", builder.Finalize());

  builder.Reset();
  CHECK(dc2.ToShortestSingle(10.0f, &builder));
  CHECK_EQ("1e1", builder.Finalize());

  builder.Reset();
  CHECK(dc2.ToShortestSingle(-0.0f, &builder));
  CHECK_EQ("-0", builder.Finalize());

  flags = DoubleToStringConverter::EMIT_TRAILING_DECIMAL_POINT |
      DoubleToStringConverter::EMIT_TRAILING_ZERO_AFTER_POINT;
  DoubleToStringConverter dc3(flags, NULL, NULL, 'E', -5, 5, 0, 0);

  builder.Reset();
  CHECK(dc3.ToShortestSingle(0.1f, &builder));
  CHECK_EQ("0.1", builder.Finalize());

  builder.Reset();
  CHECK(dc3.ToShortestSingle(1.0f, &builder));
  CHECK_EQ("1.0", builder.Finalize());

  builder.Reset();
  CHECK(dc3.ToShortestSingle(10000.0f, &builder));
  CHECK_EQ("10000.0", builder.Finalize());

  builder.Reset();
  CHECK(dc3.ToShortestSingle(100000.0f, &builder));
  CHECK_EQ("1E5", builder.Finalize());

  // Test the examples in the comments of ToShortestSingle.
  flags = DoubleToStringConverter::EMIT_POSITIVE_EXPONENT_SIGN;
  DoubleToStringConverter dc4(flags, NULL, NULL, 'e', -6, 21, 0, 0);

  builder.Reset();
  CHECK(dc4.ToShortestSingle(0.000001f, &builder));
  CHECK_EQ("0.000001", builder.Finalize());

  builder.Reset();
  CHECK(dc4.ToShortestSingle(0.0000001f, &builder));
  CHECK_EQ("1e-7", builder.Finalize());

  builder.Reset();
  CHECK(dc4.ToShortestSingle(111111111111111111111.0f, &builder));
  CHECK_EQ("111111110000000000000", builder.Finalize());

  builder.Reset();
  CHECK(dc4.ToShortestSingle(100000000000000000000.0f, &builder));
  CHECK_EQ("100000000000000000000", builder.Finalize());

  builder.Reset();
  CHECK(dc4.ToShortestSingle(1111111111111111111111.0f, &builder));
  CHECK_EQ("1.11111114e+21", builder.Finalize());

  // Test special value handling.
  DoubleToStringConverter dc5(flags, NULL, NULL, 'e', 0, 0, 0, 0);

  builder.Reset();
  CHECK(!dc5.ToShortestSingle(Single::Infinity(), &builder));

  builder.Reset();
  CHECK(!dc5.ToShortestSingle(-Single::Infinity(), &builder));

  builder.Reset();
  CHECK(!dc5.ToShortestSingle(Single::NaN(), &builder));

  builder.Reset();
  CHECK(!dc5.ToShortestSingle(-Single::NaN(), &builder));

  DoubleToStringConverter dc6(flags, "Infinity", "NaN", 'e', 0, 0, 0, 0);

  builder.Reset();
  CHECK(dc6.ToShortestSingle(Single::Infinity(), &builder));
  CHECK_EQ("Infinity", builder.Finalize());

  builder.Reset();
  CHECK(dc6.ToShortestSingle(-Single::Infinity(), &builder));
  CHECK_EQ("-Infinity", builder.Finalize());

  builder.Reset();
  CHECK(dc6.ToShortestSingle(Single::NaN(), &builder));
  CHECK_EQ("NaN", builder.Finalize());

  builder.Reset();
  CHECK(dc6.ToShortestSingle(-Single::NaN(), &builder));
  CHECK_EQ("NaN", builder.Finalize());
}


TEST(DoubleToFixed) {
  const int kBufferSize = 128;
  char buffer[kBufferSize];
  StringBuilder builder(buffer, kBufferSize);
  int flags = DoubleToStringConverter::EMIT_POSITIVE_EXPONENT_SIGN |
      DoubleToStringConverter::UNIQUE_ZERO;
  DoubleToStringConverter dc(flags, "Infinity", "NaN", 'e',
                             0, 0, 0, 0);  // Padding zeroes.

  CHECK(dc.ToFixed(0.0, 0, &builder));
  CHECK_EQ("0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-0.0, 0, &builder));
  CHECK_EQ("0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-0.0, 1, &builder));
  CHECK_EQ("0.0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-0.0, 1, &builder));
  CHECK_EQ("0.0", builder.Finalize());

  ASSERT(DoubleToStringConverter::kMaxFixedDigitsBeforePoint == 60);
  ASSERT(DoubleToStringConverter::kMaxFixedDigitsAfterPoint == 60);
  builder.Reset();
  CHECK(dc.ToFixed(
      0.0, DoubleToStringConverter::kMaxFixedDigitsAfterPoint, &builder));
  CHECK_EQ("0.000000000000000000000000000000000000000000000000000000000000",
           builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(
      9e59, DoubleToStringConverter::kMaxFixedDigitsAfterPoint, &builder));
  CHECK_EQ("899999999999999918767229449717619953810131273674690656206848."
           "000000000000000000000000000000000000000000000000000000000000",
           builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(
      -9e59, DoubleToStringConverter::kMaxFixedDigitsAfterPoint, &builder));
  CHECK_EQ("-899999999999999918767229449717619953810131273674690656206848."
           "000000000000000000000000000000000000000000000000000000000000",
           builder.Finalize());

  builder.Reset();
  CHECK(!dc.ToFixed(
      1e60, DoubleToStringConverter::kMaxFixedDigitsAfterPoint, &builder));
  CHECK_EQ(0, builder.position());

  builder.Reset();
  CHECK(!dc.ToFixed(
      9e59, DoubleToStringConverter::kMaxFixedDigitsAfterPoint + 1, &builder));
  CHECK_EQ(0, builder.position());

  builder.Reset();
  CHECK(dc.ToFixed(3.0, 0, &builder));
  CHECK_EQ("3", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(3.23, 1, &builder));
  CHECK_EQ("3.2", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(3.23, 3, &builder));
  CHECK_EQ("3.230", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(0.0323, 2, &builder));
  CHECK_EQ("0.03", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(0.0373, 2, &builder));
  CHECK_EQ("0.04", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(0.0000373, 2, &builder));
  CHECK_EQ("0.00", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(1.5, 0, &builder));
  CHECK_EQ("2", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(2.5, 0, &builder));
  CHECK_EQ("3", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(3.5, 0, &builder));
  CHECK_EQ("4", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(0.15, 1, &builder));
  CHECK_EQ("0.1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(0.25, 1, &builder));
  CHECK_EQ("0.3", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(0.35, 1, &builder));
  CHECK_EQ("0.3", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(0.45, 1, &builder));
  CHECK_EQ("0.5", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(0.55, 1, &builder));
  CHECK_EQ("0.6", builder.Finalize());

  // Test positive/negative zeroes.
  int flags2 = DoubleToStringConverter::EMIT_POSITIVE_EXPONENT_SIGN;
  DoubleToStringConverter dc2(flags2, "Infinity", "NaN", 'e',
                              0, 0, 0, 0);  // Padding zeroes.
  builder.Reset();
  CHECK(dc2.ToFixed(0.0, 1, &builder));
  CHECK_EQ("0.0", builder.Finalize());

  builder.Reset();
  CHECK(dc2.ToFixed(-0.0, 1, &builder));
  CHECK_EQ("-0.0", builder.Finalize());

  // Verify the trailing dot is emitted.
  int flags3 = DoubleToStringConverter::EMIT_POSITIVE_EXPONENT_SIGN |
      DoubleToStringConverter::EMIT_TRAILING_DECIMAL_POINT;
  DoubleToStringConverter dc3(flags3, "Infinity", "NaN", 'e',
                              0, 0, 0, 0);  // Padding zeroes.
  builder.Reset();
  CHECK(dc3.ToFixed(0.0, 0, &builder));
  CHECK_EQ("0.", builder.Finalize());

  builder.Reset();
  CHECK(dc3.ToFixed(-0.0, 0, &builder));
  CHECK_EQ("-0.", builder.Finalize());

  builder.Reset();
  CHECK(dc3.ToFixed(1.0, 0, &builder));
  CHECK_EQ("1.", builder.Finalize());

  builder.Reset();
  CHECK(dc3.ToFixed(-1.0, 0, &builder));
  CHECK_EQ("-1.", builder.Finalize());

  // Verify no trailing zero is emitted, even if the configuration is set.
  // The given parameter takes precedence.
  int flags4 = DoubleToStringConverter::EMIT_POSITIVE_EXPONENT_SIGN |
      DoubleToStringConverter::EMIT_TRAILING_DECIMAL_POINT |
      DoubleToStringConverter::EMIT_TRAILING_ZERO_AFTER_POINT;
  DoubleToStringConverter dc4(flags4, "Infinity", "NaN", 'e',
                              0, 0, 0, 0);  // Padding zeroes.
  builder.Reset();
  CHECK(dc4.ToFixed(0.0, 0, &builder));
  CHECK_EQ("0.0", builder.Finalize());

  builder.Reset();
  CHECK(dc4.ToFixed(-0.0, 0, &builder));
  CHECK_EQ("-0.0", builder.Finalize());

  builder.Reset();
  CHECK(dc4.ToFixed(1.0, 0, &builder));
  CHECK_EQ("1.0", builder.Finalize());

  builder.Reset();
  CHECK(dc4.ToFixed(-1.0, 0, &builder));
  CHECK_EQ("-1.0", builder.Finalize());

  // Test the examples in the comments of ToFixed.
  flags = DoubleToStringConverter::NO_FLAGS;
  DoubleToStringConverter dc5(flags, NULL, NULL, 'e', 0, 0, 0, 0);

  builder.Reset();
  CHECK(dc5.ToFixed(3.12, 1, &builder));
  CHECK_EQ("3.1", builder.Finalize());

  builder.Reset();
  CHECK(dc5.ToFixed(3.1415, 3, &builder));
  CHECK_EQ("3.142", builder.Finalize());

  builder.Reset();
  CHECK(dc5.ToFixed(1234.56789, 4, &builder));
  CHECK_EQ("1234.5679", builder.Finalize());

  builder.Reset();
  CHECK(dc5.ToFixed(1.23, 5, &builder));
  CHECK_EQ("1.23000", builder.Finalize());

  builder.Reset();
  CHECK(dc5.ToFixed(0.1, 4, &builder));
  CHECK_EQ("0.1000", builder.Finalize());

  builder.Reset();
  CHECK(dc5.ToFixed(1e30, 2, &builder));
  CHECK_EQ("1000000000000000019884624838656.00", builder.Finalize());

  builder.Reset();
  CHECK(dc5.ToFixed(0.1, 30, &builder));
  CHECK_EQ("0.100000000000000005551115123126", builder.Finalize());

  builder.Reset();
  CHECK(dc5.ToFixed(0.1, 17, &builder));
  CHECK_EQ("0.10000000000000001", builder.Finalize());

  builder.Reset();
  CHECK(dc5.ToFixed(123.45, 0, &builder));
  CHECK_EQ("123", builder.Finalize());

  builder.Reset();
  CHECK(dc5.ToFixed(0.678, 0, &builder));
  CHECK_EQ("1", builder.Finalize());

  flags = DoubleToStringConverter::EMIT_TRAILING_DECIMAL_POINT;
  DoubleToStringConverter dc6(flags, NULL, NULL, 'e', 0, 0, 0, 0);

  builder.Reset();
  CHECK(dc6.ToFixed(123.45, 0, &builder));
  CHECK_EQ("123.", builder.Finalize());

  builder.Reset();
  CHECK(dc6.ToFixed(0.678, 0, &builder));
  CHECK_EQ("1.", builder.Finalize());

  flags = DoubleToStringConverter::EMIT_TRAILING_DECIMAL_POINT |
      DoubleToStringConverter::EMIT_TRAILING_ZERO_AFTER_POINT;
  DoubleToStringConverter dc7(flags, NULL, NULL, 'e', 0, 0, 0, 0);

  builder.Reset();
  CHECK(dc7.ToFixed(123.45, 0, &builder));
  CHECK_EQ("123.0", builder.Finalize());

  builder.Reset();
  CHECK(dc7.ToFixed(0.678, 0, &builder));
  CHECK_EQ("1.0", builder.Finalize());

  // Test special value handling.
  DoubleToStringConverter dc8(flags, NULL, NULL, 'e', 0, 0, 0, 0);

  builder.Reset();
  CHECK(!dc8.ToFixed(Double::Infinity(), 1, &builder));

  builder.Reset();
  CHECK(!dc8.ToFixed(-Double::Infinity(), 1, &builder));

  builder.Reset();
  CHECK(!dc8.ToFixed(Double::NaN(), 1, &builder));

  builder.Reset();
  CHECK(!dc8.ToFixed(-Double::NaN(), 1, &builder));

  DoubleToStringConverter dc9(flags, "Infinity", "NaN", 'e', 0, 0, 0, 0);

  builder.Reset();
  CHECK(dc9.ToFixed(Double::Infinity(), 1, &builder));
  CHECK_EQ("Infinity", builder.Finalize());

  builder.Reset();
  CHECK(dc9.ToFixed(-Double::Infinity(), 1, &builder));
  CHECK_EQ("-Infinity", builder.Finalize());

  builder.Reset();
  CHECK(dc9.ToFixed(Double::NaN(), 1, &builder));
  CHECK_EQ("NaN", builder.Finalize());

  builder.Reset();
  CHECK(dc9.ToFixed(-Double::NaN(), 1, &builder));
  CHECK_EQ("NaN", builder.Finalize());
}


TEST(DoubleToExponential) {
  const int kBufferSize = 256;
  char buffer[kBufferSize];
  int flags = DoubleToStringConverter::EMIT_POSITIVE_EXPONENT_SIGN |
      DoubleToStringConverter::UNIQUE_ZERO;
  StringBuilder builder(buffer, kBufferSize);
  DoubleToStringConverter dc(flags, "Infinity", "NaN", 'e', 0, 0, 0, 0);

  builder.Reset();
  CHECK(dc.ToExponential(0.0, 5, &builder));
  CHECK_EQ("0.00000e+0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(0.0, 0, &builder));
  CHECK_EQ("0e+0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(0.0, 1, &builder));
  CHECK_EQ("0.0e+0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(0.123456, 5, &builder));
  CHECK_EQ("1.23456e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(1.2, 1, &builder));
  CHECK_EQ("1.2e+0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-0.0, 1, &builder));
  CHECK_EQ("0.0e+0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(0.0, 2, &builder));
  CHECK_EQ("0.00e+0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-0.0, 2, &builder));
  CHECK_EQ("0.00e+0", builder.Finalize());

  ASSERT(DoubleToStringConverter::kMaxExponentialDigits == 120);
  builder.Reset();
  CHECK(dc.ToExponential(
      0.0, DoubleToStringConverter::kMaxExponentialDigits, &builder));
  CHECK_EQ("0.00000000000000000000000000000000000000000000000000000000000"
           "0000000000000000000000000000000000000000000000000000000000000e+0",
           builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(
      9e59, DoubleToStringConverter::kMaxExponentialDigits, &builder));
  CHECK_EQ("8.99999999999999918767229449717619953810131273674690656206848"
           "0000000000000000000000000000000000000000000000000000000000000e+59",
           builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(
      -9e59, DoubleToStringConverter::kMaxExponentialDigits, &builder));
  CHECK_EQ("-8.99999999999999918767229449717619953810131273674690656206848"
           "0000000000000000000000000000000000000000000000000000000000000e+59",
           builder.Finalize());

  const double max_double = 1.7976931348623157e308;
  builder.Reset();
  CHECK(dc.ToExponential(
      max_double, DoubleToStringConverter::kMaxExponentialDigits, &builder));
  CHECK_EQ("1.79769313486231570814527423731704356798070567525844996598917"
           "4768031572607800285387605895586327668781715404589535143824642e+308",
           builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(0.000001, 2, &builder));
  CHECK_EQ("1.00e-6", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(0.0000001, 2, &builder));
  CHECK_EQ("1.00e-7", builder.Finalize());

  // Test the examples in the comments of ToExponential.
  flags = DoubleToStringConverter::NO_FLAGS;
  DoubleToStringConverter dc2(flags, "Infinity", "NaN", 'e', 0, 0, 0, 0);

  builder.Reset();
  CHECK(dc2.ToExponential(3.12, 1, &builder));
  CHECK_EQ("3.1e0", builder.Finalize());

  builder.Reset();
  CHECK(dc2.ToExponential(5.0, 3, &builder));
  CHECK_EQ("5.000e0", builder.Finalize());

  builder.Reset();
  CHECK(dc2.ToExponential(0.001, 2, &builder));
  CHECK_EQ("1.00e-3", builder.Finalize());

  builder.Reset();
  CHECK(dc2.ToExponential(3.1415, -1, &builder));
  CHECK_EQ("3.1415e0", builder.Finalize());

  builder.Reset();
  CHECK(dc2.ToExponential(3.1415, 4, &builder));
  CHECK_EQ("3.1415e0", builder.Finalize());

  builder.Reset();
  CHECK(dc2.ToExponential(3.1415, 3, &builder));
  CHECK_EQ("3.142e0", builder.Finalize());

  builder.Reset();
  CHECK(dc2.ToExponential(123456789000000, 3, &builder));
  CHECK_EQ("1.235e14", builder.Finalize());

  builder.Reset();
  CHECK(dc2.ToExponential(1000000000000000019884624838656.0, -1, &builder));
  CHECK_EQ("1e30", builder.Finalize());

  builder.Reset();
  CHECK(dc2.ToExponential(1000000000000000019884624838656.0, 32, &builder));
  CHECK_EQ("1.00000000000000001988462483865600e30", builder.Finalize());

  builder.Reset();
  CHECK(dc2.ToExponential(1234, 0, &builder));
  CHECK_EQ("1e3", builder.Finalize());

  // Test special value handling.
  DoubleToStringConverter dc3(flags, NULL, NULL, 'e', 0, 0, 0, 0);

  builder.Reset();
  CHECK(!dc3.ToExponential(Double::Infinity(), 1, &builder));

  builder.Reset();
  CHECK(!dc3.ToExponential(-Double::Infinity(), 1, &builder));

  builder.Reset();
  CHECK(!dc3.ToExponential(Double::NaN(), 1, &builder));

  builder.Reset();
  CHECK(!dc3.ToExponential(-Double::NaN(), 1, &builder));

  DoubleToStringConverter dc4(flags, "Infinity", "NaN", 'e', 0, 0, 0, 0);

  builder.Reset();
  CHECK(dc4.ToExponential(Double::Infinity(), 1, &builder));
  CHECK_EQ("Infinity", builder.Finalize());

  builder.Reset();
  CHECK(dc4.ToExponential(-Double::Infinity(), 1, &builder));
  CHECK_EQ("-Infinity", builder.Finalize());

  builder.Reset();
  CHECK(dc4.ToExponential(Double::NaN(), 1, &builder));
  CHECK_EQ("NaN", builder.Finalize());

  builder.Reset();
  CHECK(dc4.ToExponential(-Double::NaN(), 1, &builder));
  CHECK_EQ("NaN", builder.Finalize());
}


TEST(DoubleToPrecision) {
  const int kBufferSize = 256;
  char buffer[kBufferSize];
  int flags = DoubleToStringConverter::EMIT_POSITIVE_EXPONENT_SIGN |
      DoubleToStringConverter::UNIQUE_ZERO;
  StringBuilder builder(buffer, kBufferSize);
  DoubleToStringConverter dc(flags, "Infinity", "NaN", 'e',
                             0, 0,   // Padding zeroes for shortest mode.
                             6, 0);  // Padding zeroes for precision mode.

  ASSERT(DoubleToStringConverter::kMinPrecisionDigits == 1);
  CHECK(dc.ToPrecision(0.0, 1, &builder));
  CHECK_EQ("0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(-0.0, 1, &builder));
  CHECK_EQ("0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(0.0, 2, &builder));
  CHECK_EQ("0.0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(-0.0, 2, &builder));
  CHECK_EQ("0.0", builder.Finalize());

  ASSERT(DoubleToStringConverter::kMaxPrecisionDigits == 120);
  builder.Reset();
  CHECK(dc.ToPrecision(
      0.0, DoubleToStringConverter::kMaxPrecisionDigits, &builder));
  CHECK_EQ("0.00000000000000000000000000000000000000000000000000000000000"
           "000000000000000000000000000000000000000000000000000000000000",
           builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(
      9e59, DoubleToStringConverter::kMaxPrecisionDigits, &builder));
  CHECK_EQ("899999999999999918767229449717619953810131273674690656206848."
           "000000000000000000000000000000000000000000000000000000000000",
           builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(
      -9e59, DoubleToStringConverter::kMaxPrecisionDigits, &builder));
  CHECK_EQ("-899999999999999918767229449717619953810131273674690656206848."
           "000000000000000000000000000000000000000000000000000000000000",
           builder.Finalize());

  const double max_double = 1.7976931348623157e308;
  builder.Reset();
  CHECK(dc.ToPrecision(
      max_double, DoubleToStringConverter::kMaxPrecisionDigits, &builder));
  CHECK_EQ("1.79769313486231570814527423731704356798070567525844996598917"
           "476803157260780028538760589558632766878171540458953514382464e+308",
           builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(0.000001, 2, &builder));
  CHECK_EQ("0.0000010", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(0.0000001, 2, &builder));
  CHECK_EQ("1.0e-7", builder.Finalize());

  flags = DoubleToStringConverter::NO_FLAGS;
  DoubleToStringConverter dc2(flags, NULL, NULL, 'e', 0, 0, 0, 1);
  builder.Reset();
  CHECK(dc2.ToPrecision(230.0, 2, &builder));
  CHECK_EQ("230", builder.Finalize());

  builder.Reset();
  CHECK(dc2.ToPrecision(23.0, 2, &builder));
  CHECK_EQ("23", builder.Finalize());

  builder.Reset();
  CHECK(dc2.ToPrecision(2.30, 2, &builder));
  CHECK_EQ("2.3", builder.Finalize());

  builder.Reset();
  CHECK(dc2.ToPrecision(2300.0, 2, &builder));
  CHECK_EQ("2.3e3", builder.Finalize());

  flags = DoubleToStringConverter::EMIT_TRAILING_DECIMAL_POINT;
  DoubleToStringConverter dc3(flags, NULL, NULL, 'e', 0, 0, 0, 1);
  builder.Reset();
  CHECK(dc3.ToPrecision(230.0, 2, &builder));
  CHECK_EQ("230.", builder.Finalize());

  builder.Reset();
  CHECK(dc3.ToPrecision(23.0, 2, &builder));
  CHECK_EQ("23.", builder.Finalize());

  builder.Reset();
  CHECK(dc3.ToPrecision(2.30, 2, &builder));
  CHECK_EQ("2.3", builder.Finalize());

  builder.Reset();
  CHECK(dc3.ToPrecision(2300.0, 2, &builder));
  CHECK_EQ("2.3e3", builder.Finalize());

  flags = DoubleToStringConverter::EMIT_TRAILING_DECIMAL_POINT |
      DoubleToStringConverter::EMIT_TRAILING_ZERO_AFTER_POINT;
  DoubleToStringConverter dc4(flags, NULL, NULL, 'e', 0, 0, 0, 1);
  builder.Reset();
  CHECK(dc4.ToPrecision(230.0, 2, &builder));
  CHECK_EQ("2.3e2", builder.Finalize());

  builder.Reset();
  CHECK(dc4.ToPrecision(23.0, 2, &builder));
  CHECK_EQ("23.0", builder.Finalize());

  builder.Reset();
  CHECK(dc4.ToPrecision(2.30, 2, &builder));
  CHECK_EQ("2.3", builder.Finalize());

  builder.Reset();
  CHECK(dc4.ToPrecision(2300.0, 2, &builder));
  CHECK_EQ("2.3e3", builder.Finalize());

  // Test the examples in the comments of ToPrecision.
  flags = DoubleToStringConverter::NO_FLAGS;
  DoubleToStringConverter dc5(flags, "Infinity", "NaN", 'e', 0, 0, 6, 1);
  flags = DoubleToStringConverter::EMIT_TRAILING_DECIMAL_POINT;
  DoubleToStringConverter dc6(flags, "Infinity", "NaN", 'e', 0, 0, 6, 1);
  flags = DoubleToStringConverter::EMIT_TRAILING_DECIMAL_POINT |
      DoubleToStringConverter::EMIT_TRAILING_ZERO_AFTER_POINT;
  DoubleToStringConverter dc7(flags, "Infinity", "NaN", 'e', 0, 0, 6, 1);

  builder.Reset();
  CHECK(dc5.ToPrecision(0.0000012345, 2, &builder));
  CHECK_EQ("0.0000012", builder.Finalize());

  builder.Reset();
  CHECK(dc5.ToPrecision(0.00000012345, 2, &builder));
  CHECK_EQ("1.2e-7", builder.Finalize());

  builder.Reset();
  CHECK(dc5.ToPrecision(230.0, 2, &builder));
  CHECK_EQ("230", builder.Finalize());

  builder.Reset();
  CHECK(dc6.ToPrecision(230.0, 2, &builder));
  CHECK_EQ("230.", builder.Finalize());

  builder.Reset();
  CHECK(dc7.ToPrecision(230.0, 2, &builder));
  CHECK_EQ("2.3e2", builder.Finalize());

  flags = DoubleToStringConverter::NO_FLAGS;
  DoubleToStringConverter dc8(flags, NULL, NULL, 'e', 0, 0, 6, 3);

  builder.Reset();
  CHECK(dc8.ToPrecision(123450.0, 6, &builder));
  CHECK_EQ("123450", builder.Finalize());

  builder.Reset();
  CHECK(dc8.ToPrecision(123450.0, 5, &builder));
  CHECK_EQ("123450", builder.Finalize());

  builder.Reset();
  CHECK(dc8.ToPrecision(123450.0, 4, &builder));
  CHECK_EQ("123500", builder.Finalize());

  builder.Reset();
  CHECK(dc8.ToPrecision(123450.0, 3, &builder));
  CHECK_EQ("123000", builder.Finalize());

  builder.Reset();
  CHECK(dc8.ToPrecision(123450.0, 2, &builder));
  CHECK_EQ("1.2e5", builder.Finalize());

  // Test special value handling.
  builder.Reset();
  CHECK(!dc8.ToPrecision(Double::Infinity(), 1, &builder));

  builder.Reset();
  CHECK(!dc8.ToPrecision(-Double::Infinity(), 1, &builder));

  builder.Reset();
  CHECK(!dc8.ToPrecision(Double::NaN(), 1, &builder));

  builder.Reset();
  CHECK(!dc8.ToPrecision(-Double::NaN(), 1, &builder));

  builder.Reset();
  CHECK(dc7.ToPrecision(Double::Infinity(), 1, &builder));
  CHECK_EQ("Infinity", builder.Finalize());

  builder.Reset();
  CHECK(dc7.ToPrecision(-Double::Infinity(), 1, &builder));
  CHECK_EQ("-Infinity", builder.Finalize());

  builder.Reset();
  CHECK(dc7.ToPrecision(Double::NaN(), 1, &builder));
  CHECK_EQ("NaN", builder.Finalize());

  builder.Reset();
  CHECK(dc7.ToPrecision(-Double::NaN(), 1, &builder));
  CHECK_EQ("NaN", builder.Finalize());
}


TEST(DoubleToStringJavaScript) {
  const int kBufferSize = 128;
  char buffer[kBufferSize];
  StringBuilder builder(buffer, kBufferSize);
  const DoubleToStringConverter& dc =
      DoubleToStringConverter::EcmaScriptConverter();

  builder.Reset();
  CHECK(dc.ToShortest(Double::NaN(), &builder));
  CHECK_EQ("NaN", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(Double::Infinity(), &builder));
  CHECK_EQ("Infinity", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(-Double::Infinity(), &builder));
  CHECK_EQ("-Infinity", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(0.0, &builder));
  CHECK_EQ("0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(9.0, &builder));
  CHECK_EQ("9", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(90.0, &builder));
  CHECK_EQ("90", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(90.12, &builder));
  CHECK_EQ("90.12", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(0.1, &builder));
  CHECK_EQ("0.1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(0.01, &builder));
  CHECK_EQ("0.01", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(0.0123, &builder));
  CHECK_EQ("0.0123", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(111111111111111111111.0, &builder));
  CHECK_EQ("111111111111111110000", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(100000000000000000000.0, &builder));
  CHECK_EQ("100000000000000000000", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(1111111111111111111111.0, &builder));
  CHECK_EQ("1.1111111111111111e+21", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(11111111111111111111111.0, &builder));
  CHECK_EQ("1.1111111111111111e+22", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(0.00001, &builder));
  CHECK_EQ("0.00001", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(0.000001, &builder));
  CHECK_EQ("0.000001", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(0.0000001, &builder));
  CHECK_EQ("1e-7", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(0.00000012, &builder));
  CHECK_EQ("1.2e-7", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(0.000000123, &builder));
  CHECK_EQ("1.23e-7", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(0.00000001, &builder));
  CHECK_EQ("1e-8", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(0.000000012, &builder));
  CHECK_EQ("1.2e-8", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(0.000000012, &builder));
  CHECK_EQ("1.2e-8", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(0.0000000123, &builder));
  CHECK_EQ("1.23e-8", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(-0.0, &builder));
  CHECK_EQ("0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(-9.0, &builder));
  CHECK_EQ("-9", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(-90.0, &builder));
  CHECK_EQ("-90", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(-90.12, &builder));
  CHECK_EQ("-90.12", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(-0.1, &builder));
  CHECK_EQ("-0.1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(-0.01, &builder));
  CHECK_EQ("-0.01", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(-0.0123, &builder));
  CHECK_EQ("-0.0123", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(-111111111111111111111.0, &builder));
  CHECK_EQ("-111111111111111110000", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(-1111111111111111111111.0, &builder));
  CHECK_EQ("-1.1111111111111111e+21", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(-11111111111111111111111.0, &builder));
  CHECK_EQ("-1.1111111111111111e+22", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(-0.00001, &builder));
  CHECK_EQ("-0.00001", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(-0.000001, &builder));
  CHECK_EQ("-0.000001", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(-0.0000001, &builder));
  CHECK_EQ("-1e-7", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(-0.00000012, &builder));
  CHECK_EQ("-1.2e-7", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(-0.000000123, &builder));
  CHECK_EQ("-1.23e-7", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(-0.00000001, &builder));
  CHECK_EQ("-1e-8", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(-0.000000012, &builder));
  CHECK_EQ("-1.2e-8", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(-0.000000012, &builder));
  CHECK_EQ("-1.2e-8", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToShortest(-0.0000000123, &builder));
  CHECK_EQ("-1.23e-8", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(Double::NaN(), 2, &builder));
  CHECK_EQ("NaN", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(Double::Infinity(), 2, &builder));
  CHECK_EQ("Infinity", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-Double::Infinity(), 2, &builder));
  CHECK_EQ("-Infinity", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-0.1, 1, &builder));
  CHECK_EQ("-0.1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-0.1, 2, &builder));
  CHECK_EQ("-0.10", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-0.1, 3, &builder));
  CHECK_EQ("-0.100", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-0.01, 2, &builder));
  CHECK_EQ("-0.01", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-0.01, 3, &builder));
  CHECK_EQ("-0.010", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-0.01, 4, &builder));
  CHECK_EQ("-0.0100", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-0.001, 2, &builder));
  CHECK_EQ("-0.00", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-0.001, 3, &builder));
  CHECK_EQ("-0.001", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-0.001, 4, &builder));
  CHECK_EQ("-0.0010", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-1.0, 4, &builder));
  CHECK_EQ("-1.0000", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-1.0, 1, &builder));
  CHECK_EQ("-1.0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-1.0, 0, &builder));
  CHECK_EQ("-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-12.0, 0, &builder));
  CHECK_EQ("-12", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-1.1, 0, &builder));
  CHECK_EQ("-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-12.1, 0, &builder));
  CHECK_EQ("-12", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-1.12, 0, &builder));
  CHECK_EQ("-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-12.12, 0, &builder));
  CHECK_EQ("-12", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-0.0000006, 7, &builder));
  CHECK_EQ("-0.0000006", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-0.00000006, 8, &builder));
  CHECK_EQ("-0.00000006", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-0.00000006, 9, &builder));
  CHECK_EQ("-0.000000060", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-0.00000006, 10, &builder));
  CHECK_EQ("-0.0000000600", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-0, 0, &builder));
  CHECK_EQ("0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-0, 1, &builder));
  CHECK_EQ("0.0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-0, 2, &builder));
  CHECK_EQ("0.00", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(1000, 0, &builder));
  CHECK_EQ("1000", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(0.00001, 0, &builder));
  CHECK_EQ("0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(0.00001, 5, &builder));
  CHECK_EQ("0.00001", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(0.0000000000000000001, 20, &builder));
  CHECK_EQ("0.00000000000000000010", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(0.00001, 17, &builder));
  CHECK_EQ("0.00001000000000000", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(1000000000000000128.0, 0, &builder));
  CHECK_EQ("1000000000000000128", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(1000000000000000128.0, 1, &builder));
  CHECK_EQ("1000000000000000128.0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(1000000000000000128.0, 2, &builder));
  CHECK_EQ("1000000000000000128.00", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(1000000000000000128.0, 20, &builder));
  CHECK_EQ("1000000000000000128.00000000000000000000", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(0.0, 0, &builder));
  CHECK_EQ("0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-42.0, 3, &builder));
  CHECK_EQ("-42.000", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-1000000000000000128.0, 0, &builder));
  CHECK_EQ("-1000000000000000128", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-0.0000000000000000001, 20, &builder));
  CHECK_EQ("-0.00000000000000000010", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(0.123123123123123, 20, &builder));
  CHECK_EQ("0.12312312312312299889", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(0.5, 0, &builder));
  CHECK_EQ("1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(-0.5, 0, &builder));
  CHECK_EQ("-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(1.25, 1, &builder));
  CHECK_EQ("1.3", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(234.20405, 4, &builder));
  CHECK_EQ("234.2040", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToFixed(234.2040506, 4, &builder));
  CHECK_EQ("234.2041", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(1.0, -1, &builder));
  CHECK_EQ("1e+0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(11.0, -1, &builder));
  CHECK_EQ("1.1e+1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(112.0, -1, &builder));
  CHECK_EQ("1.12e+2", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(1.0, 0, &builder));
  CHECK_EQ("1e+0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(11.0, 0, &builder));
  CHECK_EQ("1e+1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(112.0, 0, &builder));
  CHECK_EQ("1e+2", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(1.0, 1, &builder));
  CHECK_EQ("1.0e+0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(11.0, 1, &builder));
  CHECK_EQ("1.1e+1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(112.0, 1, &builder));
  CHECK_EQ("1.1e+2", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(1.0, 2, &builder));
  CHECK_EQ("1.00e+0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(11.0, 2, &builder));
  CHECK_EQ("1.10e+1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(112.0, 2, &builder));
  CHECK_EQ("1.12e+2", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(1.0, 3, &builder));
  CHECK_EQ("1.000e+0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(11.0, 3, &builder));
  CHECK_EQ("1.100e+1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(112.0, 3, &builder));
  CHECK_EQ("1.120e+2", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(0.1, -1, &builder));
  CHECK_EQ("1e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(0.11, -1, &builder));
  CHECK_EQ("1.1e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(0.112, -1, &builder));
  CHECK_EQ("1.12e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(0.1, 0, &builder));
  CHECK_EQ("1e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(0.11, 0, &builder));
  CHECK_EQ("1e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(0.112, 0, &builder));
  CHECK_EQ("1e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(0.1, 1, &builder));
  CHECK_EQ("1.0e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(0.11, 1, &builder));
  CHECK_EQ("1.1e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(0.112, 1, &builder));
  CHECK_EQ("1.1e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(0.1, 2, &builder));
  CHECK_EQ("1.00e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(0.11, 2, &builder));
  CHECK_EQ("1.10e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(0.112, 2, &builder));
  CHECK_EQ("1.12e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(0.1, 3, &builder));
  CHECK_EQ("1.000e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(0.11, 3, &builder));
  CHECK_EQ("1.100e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(0.112, 3, &builder));
  CHECK_EQ("1.120e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-1.0, -1, &builder));
  CHECK_EQ("-1e+0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-11.0, -1, &builder));
  CHECK_EQ("-1.1e+1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-112.0, -1, &builder));
  CHECK_EQ("-1.12e+2", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-1.0, 0, &builder));
  CHECK_EQ("-1e+0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-11.0, 0, &builder));
  CHECK_EQ("-1e+1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-112.0, 0, &builder));
  CHECK_EQ("-1e+2", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-1.0, 1, &builder));
  CHECK_EQ("-1.0e+0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-11.0, 1, &builder));
  CHECK_EQ("-1.1e+1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-112.0, 1, &builder));
  CHECK_EQ("-1.1e+2", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-1.0, 2, &builder));
  CHECK_EQ("-1.00e+0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-11.0, 2, &builder));
  CHECK_EQ("-1.10e+1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-112.0, 2, &builder));
  CHECK_EQ("-1.12e+2", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-1.0, 3, &builder));
  CHECK_EQ("-1.000e+0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-11.0, 3, &builder));
  CHECK_EQ("-1.100e+1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-112.0, 3, &builder));
  CHECK_EQ("-1.120e+2", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-0.1, -1, &builder));
  CHECK_EQ("-1e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-0.11, -1, &builder));
  CHECK_EQ("-1.1e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-0.112, -1, &builder));
  CHECK_EQ("-1.12e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-0.1, 0, &builder));
  CHECK_EQ("-1e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-0.11, 0, &builder));
  CHECK_EQ("-1e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-0.112, 0, &builder));
  CHECK_EQ("-1e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-0.1, 1, &builder));
  CHECK_EQ("-1.0e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-0.11, 1, &builder));
  CHECK_EQ("-1.1e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-0.112, 1, &builder));
  CHECK_EQ("-1.1e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-0.1, 2, &builder));
  CHECK_EQ("-1.00e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-0.11, 2, &builder));
  CHECK_EQ("-1.10e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-0.112, 2, &builder));
  CHECK_EQ("-1.12e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-0.1, 3, &builder));
  CHECK_EQ("-1.000e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-0.11, 3, &builder));
  CHECK_EQ("-1.100e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-0.112, 3, &builder));
  CHECK_EQ("-1.120e-1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(Double::NaN(), 2, &builder));
  CHECK_EQ("NaN", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(Double::Infinity(), 2, &builder));
  CHECK_EQ("Infinity", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-Double::Infinity(), 2, &builder));
  CHECK_EQ("-Infinity", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(1.0, 0, &builder));
  CHECK_EQ("1e+0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(0.0, -1, &builder));
  CHECK_EQ("0e+0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(0.0, 2, &builder));
  CHECK_EQ("0.00e+0", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(11.2356, 0, &builder));
  CHECK_EQ("1e+1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(11.2356, 4, &builder));
  CHECK_EQ("1.1236e+1", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(0.000112356, 4, &builder));
  CHECK_EQ("1.1236e-4", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-0.000112356, 4, &builder));
  CHECK_EQ("-1.1236e-4", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(0.000112356, -1, &builder));
  CHECK_EQ("1.12356e-4", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToExponential(-0.000112356, -1, &builder));
  CHECK_EQ("-1.12356e-4", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(Double::NaN(), 1, &builder));
  CHECK_EQ("NaN", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(Double::Infinity(), 2, &builder));
  CHECK_EQ("Infinity", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(-Double::Infinity(), 2, &builder));
  CHECK_EQ("-Infinity", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(0.000555, 15, &builder));
  CHECK_EQ("0.000555000000000000", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(0.000000555, 15, &builder));
  CHECK_EQ("5.55000000000000e-7", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(-0.000000555, 15, &builder));
  CHECK_EQ("-5.55000000000000e-7", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(123456789.0, 1, &builder));
  CHECK_EQ("1e+8", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(123456789.0, 9, &builder));
  CHECK_EQ("123456789", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(123456789.0, 8, &builder));
  CHECK_EQ("1.2345679e+8", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(123456789.0, 7, &builder));
  CHECK_EQ("1.234568e+8", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(-123456789.0, 7, &builder));
  CHECK_EQ("-1.234568e+8", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(-.0000000012345, 2, &builder));
  CHECK_EQ("-1.2e-9", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(-.000000012345, 2, &builder));
  CHECK_EQ("-1.2e-8", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(-.00000012345, 2, &builder));
  CHECK_EQ("-1.2e-7", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(-.0000012345, 2, &builder));
  CHECK_EQ("-0.0000012", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(-.000012345, 2, &builder));
  CHECK_EQ("-0.000012", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(-.00012345, 2, &builder));
  CHECK_EQ("-0.00012", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(-.0012345, 2, &builder));
  CHECK_EQ("-0.0012", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(-.012345, 2, &builder));
  CHECK_EQ("-0.012", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(-.12345, 2, &builder));
  CHECK_EQ("-0.12", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(-1.2345, 2, &builder));
  CHECK_EQ("-1.2", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(-12.345, 2, &builder));
  CHECK_EQ("-12", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(-123.45, 2, &builder));
  CHECK_EQ("-1.2e+2", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(-1234.5, 2, &builder));
  CHECK_EQ("-1.2e+3", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(-12345.0, 2, &builder));
  CHECK_EQ("-1.2e+4", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(-12345.67, 4, &builder));
  CHECK_EQ("-1.235e+4", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(-12344.67, 4, &builder));
  CHECK_EQ("-1.234e+4", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(1.25, 2, &builder));
  CHECK_EQ("1.3", builder.Finalize());

  builder.Reset();
  CHECK(dc.ToPrecision(1.35, 2, &builder));
  CHECK_EQ("1.4", builder.Finalize());
}


static double StrToD16(const uc16* str16, int length, int flags,
                       double empty_string_value,
                       int* processed_characters_count, bool* processed_all) {
  StringToDoubleConverter converter(flags, empty_string_value, Double::NaN(),
                                    NULL, NULL);
  double result =
      converter.StringToDouble(str16, length, processed_characters_count);
  *processed_all = (length == *processed_characters_count);
  return result;
}


static double StrToD(const char* str, int flags, double empty_string_value,
                     int* processed_characters_count, bool* processed_all) {
  StringToDoubleConverter converter(flags, empty_string_value, Double::NaN(),
                                    NULL, NULL);
  double result = converter.StringToDouble(str, strlen(str),
                                           processed_characters_count);
  *processed_all =
      ((strlen(str) == static_cast<unsigned>(*processed_characters_count)));

  uc16 buffer16[256];
  ASSERT(strlen(str) < ARRAY_SIZE(buffer16));
  int len = strlen(str);
  for (int i = 0; i < len; i++) {
    buffer16[i] = str[i];
  }
  int processed_characters_count16;
  bool processed_all16;
  double result16 = StrToD16(buffer16, len, flags, empty_string_value,
                             &processed_characters_count16, &processed_all16);
  CHECK_EQ(result, result16);
  CHECK_EQ(*processed_characters_count, processed_characters_count16);
  return result;
}


TEST(StringToDoubleVarious) {
  int flags;
  int processed;
  bool all_used;

  flags = StringToDoubleConverter::ALLOW_LEADING_SPACES |
      StringToDoubleConverter::ALLOW_SPACES_AFTER_SIGN |
      StringToDoubleConverter::ALLOW_TRAILING_SPACES;

  CHECK_EQ(0.0, StrToD("", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0, StrToD("", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0, StrToD("  ", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0, StrToD("  ", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(42.0, StrToD("42", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(42.0, StrToD(" + 42 ", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-42.0, StrToD(" - 42 ", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD("x", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" x", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("42x", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("42 x", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" + 42 x", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" - 42 x", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);


  flags = StringToDoubleConverter::ALLOW_LEADING_SPACES |
      StringToDoubleConverter::ALLOW_SPACES_AFTER_SIGN |
      StringToDoubleConverter::ALLOW_TRAILING_SPACES |
      StringToDoubleConverter::ALLOW_TRAILING_JUNK;

  CHECK_EQ(0.0, StrToD("", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0, StrToD("", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0, StrToD("  ", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0, StrToD("  ", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(42.0, StrToD("42", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(42.0, StrToD(" + 42 ", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-42.0, StrToD(" - 42 ", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD("x", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" x", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(42.0, StrToD("42x", flags, 0.0, &processed, &all_used));
  CHECK_EQ(2, processed);

  CHECK_EQ(42.0, StrToD("42 x", flags, 0.0, &processed, &all_used));
  CHECK_EQ(3, processed);

  CHECK_EQ(42.0, StrToD(" + 42 x", flags, 0.0, &processed, &all_used));
  CHECK_EQ(6, processed);

  CHECK_EQ(-42.0, StrToD(" - 42 x", flags, 0.0, &processed, &all_used));
  CHECK_EQ(6, processed);


  flags = StringToDoubleConverter::ALLOW_LEADING_SPACES |
      StringToDoubleConverter::ALLOW_SPACES_AFTER_SIGN |
      StringToDoubleConverter::ALLOW_TRAILING_JUNK;

  CHECK_EQ(0.0, StrToD("", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0, StrToD("", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0, StrToD("  ", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0, StrToD("  ", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(42.0, StrToD("42", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(42.0, StrToD(" + 42 ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(5, processed);

  CHECK_EQ(-42.0, StrToD(" - 42 ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(5, processed);

  CHECK_EQ(Double::NaN(), StrToD("x", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" x", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(42.0, StrToD("42x", flags, 0.0, &processed, &all_used));
  CHECK_EQ(2, processed);

  CHECK_EQ(42.0, StrToD("42 x", flags, 0.0, &processed, &all_used));
  CHECK_EQ(2, processed);

  CHECK_EQ(42.0, StrToD(" + 42 x", flags, 0.0, &processed, &all_used));
  CHECK_EQ(5, processed);

  CHECK_EQ(-42.0, StrToD(" - 42 x", flags, 0.0, &processed, &all_used));
  CHECK_EQ(5, processed);

  flags = StringToDoubleConverter::ALLOW_LEADING_SPACES |
      StringToDoubleConverter::ALLOW_TRAILING_JUNK;

  CHECK_EQ(42.0, StrToD(" +42 ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(4, processed);

  CHECK_EQ(-42.0, StrToD(" -42 ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(4, processed);

  CHECK_EQ(Double::NaN(), StrToD(" + 42 ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" - 42 ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);


  flags = StringToDoubleConverter::NO_FLAGS;

  CHECK_EQ(0.0, StrToD("", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0, StrToD("", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD("  ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("  ", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(42.0, StrToD("42", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD(" + 42 ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" - 42 ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("x", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" x", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("42x", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("42 x", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" + 42 x", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" - 42 x", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);


  flags = StringToDoubleConverter::ALLOW_LEADING_SPACES;

  CHECK_EQ(0.0, StrToD(" ", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0, StrToD(" ", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(42.0, StrToD(" 42", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD("42 ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);


  flags = StringToDoubleConverter::ALLOW_TRAILING_SPACES;

  CHECK_EQ(0.0, StrToD(" ", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0, StrToD(" ", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(42.0, StrToD("42 ", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD(" 42", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);
}


TEST(StringToDoubleEmptyString) {
  int flags;
  int processed;
  bool all_used;

  flags = StringToDoubleConverter::NO_FLAGS;
  CHECK_EQ(0.0, StrToD("", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0, StrToD("", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD("", flags, Double::NaN(),
                                 &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD(" ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" ", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" ", flags, Double::NaN(),
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  flags = StringToDoubleConverter::ALLOW_SPACES_AFTER_SIGN;
  CHECK_EQ(0.0, StrToD("", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0, StrToD("", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD("", flags, Double::NaN(),
                                 &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD(" ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" ", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" ", flags, Double::NaN(),
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  flags = StringToDoubleConverter::ALLOW_LEADING_SPACES;
  CHECK_EQ(0.0, StrToD("", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0, StrToD("", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD("", flags, Double::NaN(),
                                 &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0, StrToD(" ", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0, StrToD(" ", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD(" ", flags, Double::NaN(),
                                 &processed, &all_used));
  CHECK(all_used);

  flags = StringToDoubleConverter::ALLOW_TRAILING_SPACES;
  CHECK_EQ(0.0, StrToD("", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0, StrToD("", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD("", flags, Double::NaN(),
                                 &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0, StrToD(" ", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0, StrToD(" ", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD(" ", flags, Double::NaN(),
                                 &processed, &all_used));
  CHECK(all_used);

  flags = StringToDoubleConverter::ALLOW_TRAILING_JUNK;
  CHECK_EQ(0.0, StrToD("", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0, StrToD("", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD("", flags, Double::NaN(),
                                 &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD(" ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" ", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" ", flags, Double::NaN(),
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("x", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" x", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);
}


TEST(StringToDoubleHexString) {
  int flags;
  int processed;
  bool all_used;

  flags = StringToDoubleConverter::ALLOW_HEX |
      StringToDoubleConverter::ALLOW_LEADING_SPACES |
      StringToDoubleConverter::ALLOW_TRAILING_SPACES |
      StringToDoubleConverter::ALLOW_SPACES_AFTER_SIGN;

  CHECK_EQ(18.0, StrToD("0x12", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0, StrToD("0x0", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<double>(0x123456789),
           StrToD("0x123456789", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(18.0, StrToD(" 0x12 ", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0, StrToD(" 0x0 ", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<double>(0x123456789),
           StrToD(" 0x123456789 ", flags, Double::NaN(),
                  &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<double>(0xabcdef),
           StrToD("0xabcdef", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<double>(0xabcdef),
           StrToD("0xABCDEF", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<double>(0xabcdef),
           StrToD(" 0xabcdef ", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<double>(0xabcdef),
           StrToD(" 0xABCDEF ", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD(" ", flags, Double::NaN(),
                                 &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD("0x", flags, 0.0,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 0x ", flags, 0.0,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 0x 3", flags, 0.0,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("0x3g", flags, 0.0,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("0x3.23", flags, 0.0,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("x3", flags, 0.0,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("0x3 foo", flags, 0.0,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 0x3 foo", flags, 0.0,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("+ 0x3 foo", flags, 0.0,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("+", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("-", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(-5.0, StrToD("-0x5", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-5.0, StrToD(" - 0x5 ", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(5.0, StrToD(" + 0x5 ", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD("- -0x5", flags, 0.0,  &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("- +0x5", flags, 0.0,  &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("+ +0x5", flags, 0.0,  &processed, &all_used));
  CHECK_EQ(0, processed);

  flags = StringToDoubleConverter::ALLOW_HEX;

  CHECK_EQ(18.0, StrToD("0x12", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0, StrToD("0x0", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<double>(0x123456789),
           StrToD("0x123456789", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD(" 0x12 ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 0x0 ", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 0x123456789 ", flags, Double::NaN(),
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(static_cast<double>(0xabcdef),
           StrToD("0xabcdef", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<double>(0xabcdef),
           StrToD("0xABCDEF", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(),
           StrToD(" 0xabcdef ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" 0xABCDEF ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("0x", flags, 0.0,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 0x ", flags, 0.0,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 0x 3", flags, 0.0,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("0x3g", flags, 0.0,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("0x3.23", flags, 0.0,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("x3", flags, 0.0,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("+ 0x3 foo", flags, 0.0,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("+", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("-", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(-5.0, StrToD("-0x5", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD(" - 0x5 ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" + 0x5 ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("- -0x5", flags, 0.0,  &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("- +0x5", flags, 0.0,  &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("+ +0x5", flags, 0.0,  &processed, &all_used));
  CHECK_EQ(0, processed);

  flags = StringToDoubleConverter::ALLOW_TRAILING_JUNK |
      StringToDoubleConverter::ALLOW_HEX;

  CHECK_EQ(18.0, StrToD("0x12", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0, StrToD("0x0", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<double>(0x123456789),
           StrToD("0x123456789", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD(" 0x12 ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 0x0 ", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(18.0, StrToD("0x12 ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(4, processed);

  CHECK_EQ(0.0, StrToD("0x0 ", flags, 1.0, &processed, &all_used));
  CHECK_EQ(3, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" 0x123456789 ", flags, Double::NaN(),
                  &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(static_cast<double>(0xabcdef),
           StrToD("0xabcdef", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<double>(0xabcdef),
           StrToD("0xABCDEF", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(),
           StrToD(" 0xabcdef ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" 0xABCDEF ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(static_cast<double>(0xabcdef),
           StrToD("0xabcdef ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(8, processed);

  CHECK_EQ(static_cast<double>(0xabcdef),
           StrToD("0xABCDEF ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(8, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" 0xabcdef", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" 0xABCDEF", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("0x", flags, 0.0,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 0x ", flags, 0.0,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 0x 3", flags, 0.0,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(3.0, StrToD("0x3g", flags, 0.0, &processed, &all_used));
  CHECK_EQ(3, processed);

  CHECK_EQ(3.0, StrToD("0x3.234", flags, 0.0, &processed, &all_used));
  CHECK_EQ(3, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 0x3g", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" 0x3.234", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("x3", flags, 0.0,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("+ 0x3 foo", flags, 0.0,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("+", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("-", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(-5.0, StrToD("-0x5", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD(" - 0x5 ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" + 0x5 ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("- -0x5", flags, 0.0,  &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("- +0x5", flags, 0.0,  &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("+ +0x5", flags, 0.0,  &processed, &all_used));
  CHECK_EQ(0, processed);

  flags = StringToDoubleConverter::ALLOW_TRAILING_JUNK |
      StringToDoubleConverter::ALLOW_LEADING_SPACES |
      StringToDoubleConverter::ALLOW_TRAILING_SPACES |
      StringToDoubleConverter::ALLOW_SPACES_AFTER_SIGN |
      StringToDoubleConverter::ALLOW_HEX;

  CHECK_EQ(18.0, StrToD("0x12", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0, StrToD("0x0", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<double>(0x123456789),
           StrToD("0x123456789", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(18.0, StrToD(" 0x12 ", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0, StrToD(" 0x0 ", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<double>(0x123456789),
           StrToD(" 0x123456789 ", flags, Double::NaN(),
                  &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<double>(0xabcdef),
           StrToD("0xabcdef", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<double>(0xabcdef),
           StrToD("0xABCDEF", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<double>(0xabcdef),
           StrToD(" 0xabcdef ", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<double>(0xabcdef),
           StrToD(" 0xABCDEF ", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<double>(0xabc),
           StrToD(" 0xabc def ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(7, processed);

  CHECK_EQ(static_cast<double>(0xabc),
           StrToD(" 0xABC DEF ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(7, processed);

  CHECK_EQ(static_cast<double>(0x12),
           StrToD(" 0x12 ", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0, StrToD(" 0x0 ", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<double>(0x123456789),
           StrToD(" 0x123456789 ", flags, Double::NaN(),
                  &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD(" ", flags, Double::NaN(),
                                 &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD("0x", flags, 0.0,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 0x ", flags, 0.0,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 0x 3", flags, 0.0,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ((double)0x3, StrToD("0x3g", flags, 0.0, &processed, &all_used));
  CHECK_EQ(3, processed);

  CHECK_EQ((double)0x3, StrToD("0x3.234", flags, 0.0, &processed, &all_used));
  CHECK_EQ(3, processed);

  CHECK_EQ(Double::NaN(), StrToD("x3", flags, 0.0,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);
}


TEST(StringToDoubleOctalString) {
  int flags;
  int processed;
  bool all_used;

  flags = StringToDoubleConverter::ALLOW_OCTALS |
      StringToDoubleConverter::ALLOW_LEADING_SPACES |
      StringToDoubleConverter::ALLOW_TRAILING_SPACES |
      StringToDoubleConverter::ALLOW_SPACES_AFTER_SIGN;

  CHECK_EQ(10.0, StrToD("012", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0, StrToD("00", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0, StrToD("012", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(123456789.0,
           StrToD("0123456789", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0,
           StrToD("01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0,
           StrToD("+01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-342391.0,
           StrToD("-01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0, StrToD(" 012", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0, StrToD("\n012", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0, StrToD(" 00", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0, StrToD("\t00", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0, StrToD(" 012", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0, StrToD("\n012", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(123456789.0,
           StrToD(" 0123456789", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0,
           StrToD(" 01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0,
           StrToD("\n01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0,
           StrToD(" + 01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-342391.0,
           StrToD(" - 01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-342391.0,
           StrToD("\n-\t01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0, StrToD(" 012 ", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0, StrToD(" 00 ", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0, StrToD(" 012 ", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(123456789.0,
           StrToD(" 0123456789 ", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0,
           StrToD(" 01234567 ", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0,
           StrToD(" + 01234567 ", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-342391.0,
           StrToD(" - 01234567 ", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0, StrToD("012 ", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0, StrToD("00 ", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0, StrToD("012 ", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(123456789.0,
           StrToD("0123456789 ", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0,
           StrToD("01234567 ", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0,
           StrToD("+01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-342391.0,
           StrToD("-01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(),
           StrToD("01234567e0", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);


  flags = StringToDoubleConverter::ALLOW_OCTALS;
  CHECK_EQ(10.0, StrToD("012", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0, StrToD("00", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0, StrToD("012", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(123456789.0,
           StrToD("0123456789", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0,
           StrToD("01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0,
           StrToD("+01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-342391.0,
           StrToD("-01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD(" 012", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 00", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 012", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" 0123456789", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" 01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" + 01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" - 01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 012 ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 00 ", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 012 ", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" 0123456789 ", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" 01234567 ", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" + 01234567 ", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" - 01234567 ", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("012 ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("00 ", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("012 ", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD("0123456789 ", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD("01234567 ", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(342391.0,
           StrToD("+01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-342391.0,
           StrToD("-01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(),
           StrToD("01234567e0", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);


  flags = StringToDoubleConverter::ALLOW_OCTALS |
      StringToDoubleConverter::ALLOW_TRAILING_JUNK;
  CHECK_EQ(10.0, StrToD("012", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0, StrToD("00", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0, StrToD("012", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(123456789.0,
           StrToD("0123456789", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0,
           StrToD("01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0,
           StrToD("+01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-342391.0,
           StrToD("-01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD(" 012", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 00", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 012", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" 0123456789", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" 01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" + 01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" - 01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 012 ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 00 ", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 012 ", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" 0123456789 ", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" 01234567 ", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" + 01234567 ", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" - 01234567 ", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(10.0, StrToD("012 ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(3, processed);

  CHECK_EQ(0.0, StrToD("00 ", flags, 1.0, &processed, &all_used));
  CHECK_EQ(2, processed);

  CHECK_EQ(123456789.0,
           StrToD("0123456789 ", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(10, processed);

  CHECK_EQ(342391.0,
           StrToD("01234567 ", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(8, processed);

  CHECK_EQ(342391.0,
           StrToD("+01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-342391.0,
           StrToD("-01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0, StrToD("012foo ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(3, processed);

  CHECK_EQ(0.0, StrToD("00foo ", flags, 1.0, &processed, &all_used));
  CHECK_EQ(2, processed);

  CHECK_EQ(123456789.0,
           StrToD("0123456789foo ", flags, Double::NaN(),
                  &processed, &all_used));
  CHECK_EQ(10, processed);

  CHECK_EQ(342391.0,
           StrToD("01234567foo ", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(8, processed);

  CHECK_EQ(342391.0,
           StrToD("+01234567foo", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(9, processed);

  CHECK_EQ(-342391.0,
           StrToD("-01234567foo", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(9, processed);

  CHECK_EQ(10.0, StrToD("012 foo ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(3, processed);

  CHECK_EQ(0.0, StrToD("00 foo ", flags, 1.0, &processed, &all_used));
  CHECK_EQ(2, processed);

  CHECK_EQ(123456789.0,
           StrToD("0123456789 foo ", flags, Double::NaN(),
                  &processed, &all_used));
  CHECK_EQ(10, processed);

  CHECK_EQ(342391.0,
           StrToD("01234567 foo ", flags, Double::NaN(),
                  &processed, &all_used));
  CHECK_EQ(8, processed);

  CHECK_EQ(342391.0,
           StrToD("+01234567 foo", flags, Double::NaN(),
                  &processed, &all_used));
  CHECK_EQ(9, processed);

  CHECK_EQ(-342391.0,
           StrToD("-01234567 foo", flags, Double::NaN(), &processed,
                  &all_used));
  CHECK_EQ(9, processed);

  CHECK_EQ(342391.0,
           StrToD("01234567e0", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(8, processed);

  CHECK_EQ(342391.0,
           StrToD("01234567e", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(8, processed);

  flags = StringToDoubleConverter::ALLOW_OCTALS |
      StringToDoubleConverter::ALLOW_TRAILING_SPACES |
      StringToDoubleConverter::ALLOW_TRAILING_JUNK;
  CHECK_EQ(10.0, StrToD("012", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0, StrToD("00", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0, StrToD("012", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(123456789.0,
           StrToD("0123456789", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0,
           StrToD("01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0,
           StrToD("+01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-342391.0,
           StrToD("-01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD(" 012", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 00", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 012", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" 0123456789", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" 01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" + 01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" - 01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 012 ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 00 ", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD(" 012 ", flags, 1.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" 0123456789 ", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" 01234567 ", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" + 01234567 ", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(),
           StrToD(" - 01234567 ", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(10.0, StrToD("012 ", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0, StrToD("00 ", flags, 1.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(123456789.0,
           StrToD("0123456789 ", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0,
           StrToD("01234567 ", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0,
           StrToD("+01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-342391.0,
           StrToD("-01234567", flags, Double::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0, StrToD("012foo ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(3, processed);

  CHECK_EQ(0.0, StrToD("00foo ", flags, 1.0, &processed, &all_used));
  CHECK_EQ(2, processed);

  CHECK_EQ(123456789.0,
           StrToD("0123456789foo ", flags, Double::NaN(),
                  &processed, &all_used));
  CHECK_EQ(10, processed);

  CHECK_EQ(342391.0,
           StrToD("01234567foo ", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(8, processed);

  CHECK_EQ(342391.0,
           StrToD("+01234567foo", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(9, processed);

  CHECK_EQ(-342391.0,
           StrToD("-01234567foo", flags, Double::NaN(), &processed, &all_used));
  CHECK_EQ(9, processed);

  CHECK_EQ(10.0, StrToD("012 foo ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(4, processed);

  CHECK_EQ(0.0, StrToD("00 foo ", flags, 1.0, &processed, &all_used));
  CHECK_EQ(3, processed);

  CHECK_EQ(123456789.0,
           StrToD("0123456789 foo ", flags, Double::NaN(),
                  &processed, &all_used));
  CHECK_EQ(11, processed);

  CHECK_EQ(342391.0,
           StrToD("01234567 foo ", flags, Double::NaN(),
                  &processed, &all_used));
  CHECK_EQ(9, processed);

  CHECK_EQ(342391.0,
           StrToD("+01234567 foo", flags, Double::NaN(),
                  &processed, &all_used));
  CHECK_EQ(10, processed);

  CHECK_EQ(-342391.0,
           StrToD("-01234567 foo", flags, Double::NaN(),
                  &processed, &all_used));
  CHECK_EQ(10, processed);
}


TEST(StringToDoubleSpecialValues) {
  int processed;
  int flags = StringToDoubleConverter::NO_FLAGS;

  {
    // Use 1.0 as junk_string_value.
    StringToDoubleConverter converter(flags, 0.0, 1.0, "infinity", "NaN");

    CHECK_EQ(Double::NaN(), converter.StringToDouble("+NaN", 4, &processed));
    CHECK_EQ(4, processed);

    CHECK_EQ(-Double::Infinity(),
             converter.StringToDouble("-infinity", 9, &processed));
    CHECK_EQ(9, processed);

    CHECK_EQ(1.0, converter.StringToDouble("Infinity", 8, &processed));
    CHECK_EQ(0, processed);

    CHECK_EQ(1.0, converter.StringToDouble("++NaN", 5, &processed));
    CHECK_EQ(0, processed);
  }

  {
    // Use 1.0 as junk_string_value.
    StringToDoubleConverter converter(flags, 0.0, 1.0, "+infinity", "1NaN");

    // The '+' is consumed before trying to match the infinity string.
    CHECK_EQ(1.0, converter.StringToDouble("+infinity", 9, &processed));
    CHECK_EQ(0, processed);

    // The match for "1NaN" triggers, and doesn't let the 1234.0 complete.
    CHECK_EQ(1.0, converter.StringToDouble("1234.0", 6, &processed));
    CHECK_EQ(0, processed);
  }
}


TEST(StringToDoubleCommentExamples) {
  // Make sure the examples in the comments are correct.
  int flags;
  int processed;
  bool all_used;

  flags = StringToDoubleConverter::ALLOW_HEX;

  CHECK_EQ(4660.0, StrToD("0x1234", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(),
           StrToD("0x1234.56", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  flags |= StringToDoubleConverter::ALLOW_TRAILING_JUNK;
  CHECK_EQ(4660.0,
           StrToD("0x1234.56", flags, 0.0, &processed, &all_used));
  CHECK_EQ(6, processed);

  flags = StringToDoubleConverter::ALLOW_OCTALS;
  CHECK_EQ(668.0, StrToD("01234", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(12349.0, StrToD("012349", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(),
           StrToD("01234.56", flags, 0.0, &processed, &all_used));
  CHECK_EQ(processed, 0);

  flags |= StringToDoubleConverter::ALLOW_TRAILING_JUNK;
  CHECK_EQ(668.0,
           StrToD("01234.56", flags, 0.0, &processed, &all_used));
  CHECK_EQ(processed, 5);

  flags  = StringToDoubleConverter::ALLOW_SPACES_AFTER_SIGN;
  CHECK_EQ(-123.2, StrToD("-   123.2", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  flags  = StringToDoubleConverter::ALLOW_SPACES_AFTER_SIGN;
  CHECK_EQ(123.2, StrToD("+   123.2", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  flags = StringToDoubleConverter::ALLOW_HEX |
      StringToDoubleConverter::ALLOW_TRAILING_JUNK;

  CHECK_EQ(4660.0, StrToD("0x1234", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(4660.0, StrToD("0x1234K", flags, 0.0, &processed, &all_used));
  CHECK_EQ(processed, 6);

  CHECK_EQ(0.0, StrToD("", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD(" ", flags, 0.0, &processed, &all_used));
  CHECK_EQ(processed, 0);

  CHECK_EQ(Double::NaN(), StrToD(" 1", flags, 0.0, &processed, &all_used));
  CHECK_EQ(processed, 0);

  CHECK_EQ(Double::NaN(), StrToD("0x", flags, 0.0, &processed, &all_used));
  CHECK_EQ(processed, 0);

  CHECK_EQ(-123.45, StrToD("-123.45", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(),
           StrToD("--123.45", flags, 0.0, &processed, &all_used));
  CHECK_EQ(processed, 0);

  CHECK_EQ(123e45, StrToD("123e45", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(123e45, StrToD("123E45", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(123e45, StrToD("123e+45", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(123e-45, StrToD("123e-45", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(123.0, StrToD("123e", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(123.0, StrToD("123e-", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  {
    StringToDoubleConverter converter(flags, 0.0, 1.0, "infinity", "NaN");
    CHECK_EQ(Double::NaN(), converter.StringToDouble("+NaN", 4, &processed));
    CHECK_EQ(4, processed);

    CHECK_EQ(-Double::Infinity(),
             converter.StringToDouble("-infinity", 9, &processed));
    CHECK_EQ(9, processed);

    CHECK_EQ(1.0, converter.StringToDouble("Infinity", 9, &processed));
    CHECK_EQ(0, processed);
  }

  flags = StringToDoubleConverter::ALLOW_OCTALS |
      StringToDoubleConverter::ALLOW_LEADING_SPACES;

  CHECK_EQ(Double::NaN(), StrToD("0x1234", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(668.0, StrToD("01234", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0, StrToD("", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0, StrToD(" ", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0, StrToD(" 1", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToD("0x", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("0123e45", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(1239e45, StrToD("01239e45", flags, 0.0, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(),
           StrToD("-infinity", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToD("NaN", flags, 0.0, &processed, &all_used));
  CHECK_EQ(0, processed);
}


static float StrToF16(const uc16* str16, int length, int flags,
                      double empty_string_value,
                      int* processed_characters_count,
                      bool* processed_all) {
  StringToDoubleConverter converter(flags, empty_string_value, Double::NaN(),
                                    NULL, NULL);
  double result =
      converter.StringToFloat(str16, length, processed_characters_count);
  *processed_all = (length == *processed_characters_count);
  return result;
}


static double StrToF(const char* str, int flags, double empty_string_value,
                     int* processed_characters_count, bool* processed_all) {
  StringToDoubleConverter converter(flags, empty_string_value, Single::NaN(),
                                    NULL, NULL);
  float result = converter.StringToFloat(str, strlen(str),
                                         processed_characters_count);
  *processed_all =
      ((strlen(str) == static_cast<unsigned>(*processed_characters_count)));

  uc16 buffer16[256];
  ASSERT(strlen(str) < ARRAY_SIZE(buffer16));
  int len = strlen(str);
  for (int i = 0; i < len; i++) {
    buffer16[i] = str[i];
  }
  int processed_characters_count16;
  bool processed_all16;
  float result16 = StrToF16(buffer16, len, flags, empty_string_value,
                            &processed_characters_count16,
                            &processed_all16);
  CHECK_EQ(result, result16);
  CHECK_EQ(*processed_characters_count, processed_characters_count16);
  return result;
}


TEST(StringToFloatVarious) {
  int flags;
  int processed;
  bool all_used;

  flags = StringToDoubleConverter::ALLOW_LEADING_SPACES |
      StringToDoubleConverter::ALLOW_SPACES_AFTER_SIGN |
      StringToDoubleConverter::ALLOW_TRAILING_SPACES;

  CHECK_EQ(0.0f, StrToF("", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0f, StrToF("", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0f, StrToF("  ", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0f, StrToF("  ", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(42.0f, StrToF("42", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(42.0f, StrToF(" + 42 ", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-42.0f, StrToF(" - 42 ", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToF("x", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToF(" x", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToF("42x", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToF("42 x", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToF(" + 42 x", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToF(" - 42 x", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);


  flags = StringToDoubleConverter::ALLOW_LEADING_SPACES |
      StringToDoubleConverter::ALLOW_SPACES_AFTER_SIGN |
      StringToDoubleConverter::ALLOW_TRAILING_SPACES |
      StringToDoubleConverter::ALLOW_TRAILING_JUNK;

  CHECK_EQ(0.0f, StrToF("", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0f, StrToF("", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0f, StrToF("  ", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0f, StrToF("  ", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(42.0f, StrToF("42", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(42.0f, StrToF(" + 42 ", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-42.0f, StrToF(" - 42 ", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToF("x", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToF(" x", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(42.0f, StrToF("42x", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(2, processed);

  CHECK_EQ(42.0f, StrToF("42 x", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(3, processed);

  CHECK_EQ(42.0f, StrToF(" + 42 x", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(6, processed);

  CHECK_EQ(-42.0f, StrToF(" - 42 x", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(6, processed);


  flags = StringToDoubleConverter::ALLOW_LEADING_SPACES |
      StringToDoubleConverter::ALLOW_SPACES_AFTER_SIGN |
      StringToDoubleConverter::ALLOW_TRAILING_JUNK;

  CHECK_EQ(0.0f, StrToF("", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0f, StrToF("", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0f, StrToF("  ", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0f, StrToF("  ", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(42.0f, StrToF("42", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(42.0f, StrToF(" + 42 ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(5, processed);

  CHECK_EQ(-42.0f, StrToF(" - 42 ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(5, processed);

  CHECK_EQ(Double::NaN(), StrToF("x", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToF(" x", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(42.0f, StrToF("42x", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(2, processed);

  CHECK_EQ(42.0f, StrToF("42 x", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(2, processed);

  CHECK_EQ(42.0f, StrToF(" + 42 x", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(5, processed);

  CHECK_EQ(-42.0f, StrToF(" - 42 x", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(5, processed);

  flags = StringToDoubleConverter::ALLOW_LEADING_SPACES |
      StringToDoubleConverter::ALLOW_TRAILING_JUNK;

  CHECK_EQ(42.0f, StrToF(" +42 ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(4, processed);

  CHECK_EQ(-42.0f, StrToF(" -42 ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(4, processed);

  CHECK_EQ(Double::NaN(), StrToF(" + 42 ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToF(" - 42 ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);


  flags = StringToDoubleConverter::NO_FLAGS;

  CHECK_EQ(0.0f, StrToF("", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0f, StrToF("", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToF("  ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToF("  ", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(42.0f, StrToF("42", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToF(" + 42 ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToF(" - 42 ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToF("x", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToF(" x", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToF("42x", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToF("42 x", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToF(" + 42 x", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Double::NaN(), StrToF(" - 42 x", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);


  flags = StringToDoubleConverter::ALLOW_LEADING_SPACES;

  CHECK_EQ(0.0f, StrToF(" ", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0f, StrToF(" ", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(42.0f, StrToF(" 42", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToF("42 ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);


  flags = StringToDoubleConverter::ALLOW_TRAILING_SPACES;

  CHECK_EQ(0.0f, StrToF(" ", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0f, StrToF(" ", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(42.0f, StrToF("42 ", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Double::NaN(), StrToF(" 42", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);
}

TEST(StringToFloatEmptyString) {
  int flags;
  int processed;
  bool all_used;

  flags = StringToDoubleConverter::NO_FLAGS;
  CHECK_EQ(0.0f, StrToF("", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0f, StrToF("", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(), StrToF("", flags, Single::NaN(),
                                 &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(), StrToF(" ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" ", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" ", flags, Single::NaN(),
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  flags = StringToDoubleConverter::ALLOW_SPACES_AFTER_SIGN;
  CHECK_EQ(0.0f, StrToF("", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0f, StrToF("", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(), StrToF("", flags, Single::NaN(),
                                 &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(), StrToF(" ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" ", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" ", flags, Single::NaN(),
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  flags = StringToDoubleConverter::ALLOW_LEADING_SPACES;
  CHECK_EQ(0.0f, StrToF("", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0f, StrToF("", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(), StrToF("", flags, Single::NaN(),
                                 &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0f, StrToF(" ", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0f, StrToF(" ", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(), StrToF(" ", flags, Single::NaN(),
                                 &processed, &all_used));
  CHECK(all_used);

  flags = StringToDoubleConverter::ALLOW_TRAILING_SPACES;
  CHECK_EQ(0.0f, StrToF("", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0f, StrToF("", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(), StrToF("", flags, Single::NaN(),
                                 &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0f, StrToF(" ", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0f, StrToF(" ", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(), StrToF(" ", flags, Single::NaN(),
                                 &processed, &all_used));
  CHECK(all_used);

  flags = StringToDoubleConverter::ALLOW_TRAILING_JUNK;
  CHECK_EQ(0.0f, StrToF("", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(1.0f, StrToF("", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(), StrToF("", flags, Single::NaN(),
                                 &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(), StrToF(" ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" ", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" ", flags, Single::NaN(),
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("x", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" x", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);
}

TEST(StringToFloatHexString) {
  int flags;
  int processed;
  bool all_used;
  double d;
  float f;

  flags = StringToDoubleConverter::ALLOW_HEX |
      StringToDoubleConverter::ALLOW_LEADING_SPACES |
      StringToDoubleConverter::ALLOW_TRAILING_SPACES |
      StringToDoubleConverter::ALLOW_SPACES_AFTER_SIGN;

  // Check that no double rounding occurs:
  const char* double_rounding_example1 = "0x100000100000008";
  d = StrToD(double_rounding_example1, flags, 0.0, &processed, &all_used);
  f = StrToF(double_rounding_example1, flags, 0.0f, &processed, &all_used);
  CHECK(f != static_cast<float>(d));
  CHECK_EQ(72057602627862528.0f, StrToF(double_rounding_example1,
                                        flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  const char* double_rounding_example2 = "0x1000002FFFFFFF8";
  d = StrToD(double_rounding_example2, flags, 0.0, &processed, &all_used);
  f = StrToF(double_rounding_example2, flags, 0.0f, &processed, &all_used);
  CHECK(f != static_cast<float>(d));
  CHECK_EQ(72057602627862528.0f, StrToF(double_rounding_example2,
                                        flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(18.0f, StrToF("0x12", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0f, StrToF("0x0", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<float>(0x123456789),
           StrToF("0x123456789", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(18.0f, StrToF(" 0x12 ", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0f, StrToF(" 0x0 ", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<float>(0x123456789),
           StrToF(" 0x123456789 ", flags, Single::NaN(),
                  &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<float>(0xabcdef),
           StrToF("0xabcdef", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<float>(0xabcdef),
           StrToF("0xABCDEF", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<float>(0xabcdef),
           StrToF(" 0xabcdef ", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<float>(0xabcdef),
           StrToF(" 0xABCDEF ", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(), StrToF(" ", flags, Single::NaN(),
                                 &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(), StrToF("0x", flags, 0.0f,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 0x ", flags, 0.0f,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 0x 3", flags, 0.0f,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("0x3g", flags, 0.0f,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("0x3.23", flags, 0.0f,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("x3", flags, 0.0f,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("0x3 foo", flags, 0.0f,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 0x3 foo", flags, 0.0f,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("+ 0x3 foo", flags, 0.0f,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("+", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("-", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(-5.0f, StrToF("-0x5", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-5.0f, StrToF(" - 0x5 ", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(5.0f, StrToF(" + 0x5 ", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(), StrToF("- -0x5", flags, 0.0f,  &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("- +0x5", flags, 0.0f,  &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("+ +0x5", flags, 0.0f,  &processed, &all_used));
  CHECK_EQ(0, processed);

  flags = StringToDoubleConverter::ALLOW_HEX;

  CHECK_EQ(18.0f, StrToF("0x12", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0f, StrToF("0x0", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<float>(0x123456789),
           StrToF("0x123456789", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(), StrToF(" 0x12 ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 0x0 ", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 0x123456789 ", flags, Single::NaN(),
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(static_cast<float>(0xabcdef),
           StrToF("0xabcdef", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<float>(0xabcdef),
           StrToF("0xABCDEF", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(),
           StrToF(" 0xabcdef ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" 0xABCDEF ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("0x", flags, 0.0f,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 0x ", flags, 0.0f,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 0x 3", flags, 0.0f,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("0x3g", flags, 0.0f,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("0x3.23", flags, 0.0f,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("x3", flags, 0.0f,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("+ 0x3 foo", flags, 0.0f,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("+", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("-", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(-5.0f, StrToF("-0x5", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(), StrToF(" - 0x5 ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" + 0x5 ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("- -0x5", flags, 0.0f,  &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("- +0x5", flags, 0.0f,  &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("+ +0x5", flags, 0.0f,  &processed, &all_used));
  CHECK_EQ(0, processed);

  flags = StringToDoubleConverter::ALLOW_TRAILING_JUNK |
      StringToDoubleConverter::ALLOW_HEX;

  CHECK_EQ(18.0f, StrToF("0x12", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0f, StrToF("0x0", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<float>(0x123456789),
           StrToF("0x123456789", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(), StrToF(" 0x12 ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 0x0 ", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(18.0f, StrToF("0x12 ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(4, processed);

  CHECK_EQ(0.0f, StrToF("0x0 ", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(3, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" 0x123456789 ", flags, Single::NaN(),
                  &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(static_cast<float>(0xabcdef),
           StrToF("0xabcdef", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<float>(0xabcdef),
           StrToF("0xABCDEF", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(),
           StrToF(" 0xabcdef ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" 0xABCDEF ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(static_cast<float>(0xabcdef),
           StrToF("0xabcdef ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(8, processed);

  CHECK_EQ(static_cast<float>(0xabcdef),
           StrToF("0xABCDEF ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(8, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" 0xabcdef", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" 0xABCDEF", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("0x", flags, 0.0f,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 0x ", flags, 0.0f,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 0x 3", flags, 0.0f,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(3.0f, StrToF("0x3g", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(3, processed);

  CHECK_EQ(3.0f, StrToF("0x3.234", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(3, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 0x3g", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" 0x3.234", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("x3", flags, 0.0f,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("+ 0x3 foo", flags, 0.0f,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("+", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("-", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(-5.0f, StrToF("-0x5", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(), StrToF(" - 0x5 ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" + 0x5 ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("- -0x5", flags, 0.0f,  &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("- +0x5", flags, 0.0f,  &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("+ +0x5", flags, 0.0f,  &processed, &all_used));
  CHECK_EQ(0, processed);

  flags = StringToDoubleConverter::ALLOW_TRAILING_JUNK |
      StringToDoubleConverter::ALLOW_LEADING_SPACES |
      StringToDoubleConverter::ALLOW_TRAILING_SPACES |
      StringToDoubleConverter::ALLOW_SPACES_AFTER_SIGN |
      StringToDoubleConverter::ALLOW_HEX;

  CHECK_EQ(18.0f, StrToF("0x12", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0f, StrToF("0x0", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<float>(0x123456789),
           StrToF("0x123456789", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(18.0f, StrToF(" 0x12 ", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0f, StrToF(" 0x0 ", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<float>(0x123456789),
           StrToF(" 0x123456789 ", flags, Single::NaN(),
                  &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<float>(0xabcdef),
           StrToF("0xabcdef", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<float>(0xabcdef),
           StrToF("0xABCDEF", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<float>(0xabcdef),
           StrToF(" 0xabcdef ", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<float>(0xabcdef),
           StrToF(" 0xABCDEF ", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<float>(0xabc),
           StrToF(" 0xabc def ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(7, processed);

  CHECK_EQ(static_cast<float>(0xabc),
           StrToF(" 0xABC DEF ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(7, processed);

  CHECK_EQ(static_cast<float>(0x12),
           StrToF(" 0x12 ", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0f, StrToF(" 0x0 ", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(static_cast<float>(0x123456789),
           StrToF(" 0x123456789 ", flags, Single::NaN(),
                  &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(), StrToF(" ", flags, Single::NaN(),
                                 &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(), StrToF("0x", flags, 0.0f,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 0x ", flags, 0.0f,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 0x 3", flags, 0.0f,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ((float)0x3, StrToF("0x3g", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(3, processed);

  CHECK_EQ((float)0x3, StrToF("0x3.234", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(3, processed);

  CHECK_EQ(Single::NaN(), StrToF("x3", flags, 0.0f,
                                 &processed, &all_used));
  CHECK_EQ(0, processed);
}


TEST(StringToFloatOctalString) {
  int flags;
  int processed;
  bool all_used;
  double d;
  float f;

  flags = StringToDoubleConverter::ALLOW_OCTALS |
      StringToDoubleConverter::ALLOW_LEADING_SPACES |
      StringToDoubleConverter::ALLOW_TRAILING_SPACES |
      StringToDoubleConverter::ALLOW_SPACES_AFTER_SIGN;

  // Check that no double rounding occurs:
  const char* double_rounding_example1 = "04000000040000000010";
  d = StrToD(double_rounding_example1, flags, 0.0, &processed, &all_used);
  f = StrToF(double_rounding_example1, flags, 0.0f, &processed, &all_used);
  CHECK(f != static_cast<float>(d));
  CHECK_EQ(72057602627862528.0f, StrToF(double_rounding_example1,
                                        flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  const char* double_rounding_example2 = "04000000137777777770";
  d = StrToD(double_rounding_example2, flags, 0.0, &processed, &all_used);
  f = StrToF(double_rounding_example2, flags, 0.0f, &processed, &all_used);
  CHECK(f != static_cast<float>(d));
  CHECK_EQ(72057602627862528.0f, StrToF(double_rounding_example2,
                                        flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0f, StrToF("012", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0f, StrToF("00", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0f, StrToF("012", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(123456789.0f,
           StrToF("0123456789", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0f,
           StrToF("01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0f,
           StrToF("+01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-342391.0f,
           StrToF("-01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0f, StrToF(" 012", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0f, StrToF(" 00", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0f, StrToF(" 012", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(123456789.0f,
           StrToF(" 0123456789", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0f,
           StrToF(" 01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0f,
           StrToF(" + 01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-342391.0f,
           StrToF(" - 01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0f, StrToF(" 012 ", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0f, StrToF(" 00 ", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0f, StrToF(" 012 ", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(123456789.0f,
           StrToF(" 0123456789 ", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0f,
           StrToF(" 01234567 ", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0f,
           StrToF(" + 01234567 ", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-342391.0f,
           StrToF(" - 01234567 ", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0f, StrToF("012 ", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0f, StrToF("00 ", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0f, StrToF("012 ", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(123456789.0f,
           StrToF("0123456789 ", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0f,
           StrToF("01234567 ", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0f,
           StrToF("+01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-342391.0f,
           StrToF("-01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(),
           StrToF("01234567e0", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);


  flags = StringToDoubleConverter::ALLOW_OCTALS;
  CHECK_EQ(10.0f, StrToF("012", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0f, StrToF("00", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0f, StrToF("012", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(123456789.0f,
           StrToF("0123456789", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0f,
           StrToF("01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0f,
           StrToF("+01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-342391.0f,
           StrToF("-01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(), StrToF(" 012", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 00", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 012", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" 0123456789", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" 01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" + 01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" - 01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 012 ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 00 ", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 012 ", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" 0123456789 ", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" 01234567 ", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" + 01234567 ", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" - 01234567 ", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("012 ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("00 ", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF("012 ", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF("0123456789 ", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF("01234567 ", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(342391.0f,
           StrToF("+01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-342391.0f,
           StrToF("-01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(),
           StrToF("01234567e0", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);


  flags = StringToDoubleConverter::ALLOW_OCTALS |
      StringToDoubleConverter::ALLOW_TRAILING_JUNK;
  CHECK_EQ(10.0f, StrToF("012", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0f, StrToF("00", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0f, StrToF("012", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(123456789.0f,
           StrToF("0123456789", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0f,
           StrToF("01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0f,
           StrToF("+01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-342391.0f,
           StrToF("-01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(), StrToF(" 012", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 00", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 012", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" 0123456789", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" 01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" + 01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" - 01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 012 ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 00 ", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 012 ", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" 0123456789 ", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" 01234567 ", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" + 01234567 ", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" - 01234567 ", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(10.0f, StrToF("012 ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(3, processed);

  CHECK_EQ(0.0f, StrToF("00 ", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(2, processed);

  CHECK_EQ(123456789.0f,
           StrToF("0123456789 ", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(10, processed);

  CHECK_EQ(342391.0f,
           StrToF("01234567 ", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(8, processed);

  CHECK_EQ(342391.0f,
           StrToF("+01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-342391.0f,
           StrToF("-01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0f, StrToF("012foo ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(3, processed);

  CHECK_EQ(0.0f, StrToF("00foo ", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(2, processed);

  CHECK_EQ(123456789.0f,
           StrToF("0123456789foo ", flags, Single::NaN(),
                  &processed, &all_used));
  CHECK_EQ(10, processed);

  CHECK_EQ(342391.0f,
           StrToF("01234567foo ", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(8, processed);

  CHECK_EQ(342391.0f,
           StrToF("+01234567foo", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(9, processed);

  CHECK_EQ(-342391.0f,
           StrToF("-01234567foo", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(9, processed);

  CHECK_EQ(10.0f, StrToF("012 foo ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(3, processed);

  CHECK_EQ(0.0f, StrToF("00 foo ", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(2, processed);

  CHECK_EQ(123456789.0f,
           StrToF("0123456789 foo ", flags, Single::NaN(),
                  &processed, &all_used));
  CHECK_EQ(10, processed);

  CHECK_EQ(342391.0f,
           StrToF("01234567 foo ", flags, Single::NaN(),
                  &processed, &all_used));
  CHECK_EQ(8, processed);

  CHECK_EQ(342391.0f,
           StrToF("+01234567 foo", flags, Single::NaN(),
                  &processed, &all_used));
  CHECK_EQ(9, processed);

  CHECK_EQ(-342391.0f,
           StrToF("-01234567 foo", flags, Single::NaN(), &processed,
                  &all_used));
  CHECK_EQ(9, processed);

  CHECK_EQ(342391.0f,
           StrToF("01234567e0", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(8, processed);

  CHECK_EQ(342391.0f,
           StrToF("01234567e", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(8, processed);

  flags = StringToDoubleConverter::ALLOW_OCTALS |
      StringToDoubleConverter::ALLOW_TRAILING_SPACES |
      StringToDoubleConverter::ALLOW_TRAILING_JUNK;
  CHECK_EQ(10.0f, StrToF("012", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0f, StrToF("00", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0f, StrToF("012", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(123456789.0f,
           StrToF("0123456789", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0f,
           StrToF("01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0f,
           StrToF("+01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-342391.0f,
           StrToF("-01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(Single::NaN(), StrToF(" 012", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 00", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 012", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" 0123456789", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" 01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" + 01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" - 01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 012 ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 00 ", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(), StrToF(" 012 ", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" 0123456789 ", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" 01234567 ", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" + 01234567 ", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(Single::NaN(),
           StrToF(" - 01234567 ", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(0, processed);

  CHECK_EQ(10.0f, StrToF("012 ", flags, 0.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(0.0f, StrToF("00 ", flags, 1.0f, &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(123456789.0f,
           StrToF("0123456789 ", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0f,
           StrToF("01234567 ", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(342391.0f,
           StrToF("+01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(-342391.0f,
           StrToF("-01234567", flags, Single::NaN(), &processed, &all_used));
  CHECK(all_used);

  CHECK_EQ(10.0f, StrToF("012foo ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(3, processed);

  CHECK_EQ(0.0f, StrToF("00foo ", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(2, processed);

  CHECK_EQ(123456789.0f,
           StrToF("0123456789foo ", flags, Single::NaN(),
                  &processed, &all_used));
  CHECK_EQ(10, processed);

  CHECK_EQ(342391.0f,
           StrToF("01234567foo ", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(8, processed);

  CHECK_EQ(342391.0f,
           StrToF("+01234567foo", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(9, processed);

  CHECK_EQ(-342391.0f,
           StrToF("-01234567foo", flags, Single::NaN(), &processed, &all_used));
  CHECK_EQ(9, processed);

  CHECK_EQ(10.0f, StrToF("012 foo ", flags, 0.0f, &processed, &all_used));
  CHECK_EQ(4, processed);

  CHECK_EQ(0.0f, StrToF("00 foo ", flags, 1.0f, &processed, &all_used));
  CHECK_EQ(3, processed);

  CHECK_EQ(123456789.0f,
           StrToF("0123456789 foo ", flags, Single::NaN(),
                  &processed, &all_used));
  CHECK_EQ(11, processed);

  CHECK_EQ(342391.0f,
           StrToF("01234567 foo ", flags, Single::NaN(),
                  &processed, &all_used));
  CHECK_EQ(9, processed);

  CHECK_EQ(342391.0f,
           StrToF("+01234567 foo", flags, Single::NaN(),
                  &processed, &all_used));
  CHECK_EQ(10, processed);

  CHECK_EQ(-342391.0f,
           StrToF("-01234567 foo", flags, Single::NaN(),
                  &processed, &all_used));
  CHECK_EQ(10, processed);
}


TEST(StringToFloatSpecialValues) {
  int processed;
  int flags = StringToDoubleConverter::NO_FLAGS;

  {
    // Use 1.0 as junk_string_value.
    StringToDoubleConverter converter(flags, 0.0f, 1.0f, "infinity", "NaN");

    CHECK_EQ(Single::NaN(), converter.StringToDouble("+NaN", 4, &processed));
    CHECK_EQ(4, processed);

    CHECK_EQ(-Single::Infinity(),
             converter.StringToDouble("-infinity", 9, &processed));
    CHECK_EQ(9, processed);

    CHECK_EQ(1.0f, converter.StringToDouble("Infinity", 8, &processed));
    CHECK_EQ(0, processed);

    CHECK_EQ(1.0f, converter.StringToDouble("++NaN", 5, &processed));
    CHECK_EQ(0, processed);
  }

  {
    // Use 1.0 as junk_string_value.
    StringToDoubleConverter converter(flags, 0.0f, 1.0f, "+infinity", "1NaN");

    // The '+' is consumed before trying to match the infinity string.
    CHECK_EQ(1.0f, converter.StringToDouble("+infinity", 9, &processed));
    CHECK_EQ(0, processed);

    // The match for "1NaN" triggers, and doesn't let the 1234.0 complete.
    CHECK_EQ(1.0f, converter.StringToDouble("1234.0", 6, &processed));
    CHECK_EQ(0, processed);
  }
}


TEST(StringToDoubleFloatWhitespace) {
  int flags;
  int processed;
  bool all_used;

  flags = StringToDoubleConverter::ALLOW_LEADING_SPACES |
      StringToDoubleConverter::ALLOW_TRAILING_SPACES |
      StringToDoubleConverter::ALLOW_SPACES_AFTER_SIGN;

  const char kWhitespaceAscii[] = {
    0x0A, 0x0D, 0x09, 0x0B, 0x0C, 0x20,
    '-',
    0x0A, 0x0D, 0x09, 0x0B, 0x0C, 0x20,
    '1', '.', '2',
    0x0A, 0x0D, 0x09, 0x0B, 0x0C, 0x20,
    0x00
  };
  CHECK_EQ(-1.2, StrToD(kWhitespaceAscii, flags, Double::NaN(),
                        &processed, &all_used));
  CHECK(all_used);
  CHECK_EQ(-1.2f, StrToF(kWhitespaceAscii, flags, Double::NaN(),
                         &processed, &all_used));
  CHECK(all_used);

  const uc16 kOghamSpaceMark = 0x1680;
  const uc16 kMongolianVowelSeparator = 0x180E;
  const uc16 kEnQuad = 0x2000;
  const uc16 kEmQuad = 0x2001;
  const uc16 kEnSpace = 0x2002;
  const uc16 kEmSpace = 0x2003;
  const uc16 kThreePerEmSpace = 0x2004;
  const uc16 kFourPerEmSpace = 0x2005;
  const uc16 kSixPerEmSpace = 0x2006;
  const uc16 kFigureSpace = 0x2007;
  const uc16 kPunctuationSpace = 0x2008;
  const uc16 kThinSpace = 0x2009;
  const uc16 kHairSpace = 0x200A;
  const uc16 kNarrowNoBreakSpace = 0x202F;
  const uc16 kMediumMathematicalSpace = 0x205F;
  const uc16 kIdeographicSpace = 0x3000;

  const uc16 kWhitespace16[] = {
    0x0A, 0x0D, 0x09, 0x0B, 0x0C, 0x20, 0xA0, 0xFEFF,
    kOghamSpaceMark, kMongolianVowelSeparator, kEnQuad, kEmQuad,
    kEnSpace, kEmSpace, kThreePerEmSpace, kFourPerEmSpace, kSixPerEmSpace,
    kFigureSpace, kPunctuationSpace, kThinSpace, kHairSpace,
    kNarrowNoBreakSpace, kMediumMathematicalSpace, kIdeographicSpace,
    '-',
    0x0A, 0x0D, 0x09, 0x0B, 0x0C, 0x20, 0xA0, 0xFEFF,
    kOghamSpaceMark, kMongolianVowelSeparator, kEnQuad, kEmQuad,
    kEnSpace, kEmSpace, kThreePerEmSpace, kFourPerEmSpace, kSixPerEmSpace,
    kFigureSpace, kPunctuationSpace, kThinSpace, kHairSpace,
    kNarrowNoBreakSpace, kMediumMathematicalSpace, kIdeographicSpace,
    '1', '.', '2',
    0x0A, 0x0D, 0x09, 0x0B, 0x0C, 0x20, 0xA0, 0xFEFF,
    kOghamSpaceMark, kMongolianVowelSeparator, kEnQuad, kEmQuad,
    kEnSpace, kEmSpace, kThreePerEmSpace, kFourPerEmSpace, kSixPerEmSpace,
    kFigureSpace, kPunctuationSpace, kThinSpace, kHairSpace,
    kNarrowNoBreakSpace, kMediumMathematicalSpace, kIdeographicSpace,
  };
  const int kWhitespace16Length = ARRAY_SIZE(kWhitespace16);
  CHECK_EQ(-1.2, StrToD16(kWhitespace16, kWhitespace16Length, flags,
                          Double::NaN(),
                          &processed, &all_used));
  CHECK(all_used);
  CHECK_EQ(-1.2f, StrToF16(kWhitespace16, kWhitespace16Length, flags,
                           Single::NaN(),
                           &processed, &all_used));
  CHECK(all_used);
}


TEST(StringToDoubleCaseInsensitiveSpecialValues) {
  int processed = 0;

  int flags = StringToDoubleConverter::ALLOW_CASE_INSENSIBILITY |
    StringToDoubleConverter::ALLOW_LEADING_SPACES |
    StringToDoubleConverter::ALLOW_TRAILING_JUNK |
    StringToDoubleConverter::ALLOW_TRAILING_SPACES;

  // Use 1.0 as junk_string_value.
  StringToDoubleConverter converter(flags, 0.0, 1.0, "infinity", "nan");

  CHECK_EQ(Double::NaN(), converter.StringToDouble("+nan", 4, &processed));
  CHECK_EQ(4, processed);

  CHECK_EQ(Double::NaN(), converter.StringToDouble("-nAN", 4, &processed));
  CHECK_EQ(4, processed);

  CHECK_EQ(Double::NaN(), converter.StringToDouble("nAN", 3, &processed));
  CHECK_EQ(3, processed);

  CHECK_EQ(Double::NaN(), converter.StringToDouble("nANabc", 6, &processed));
  CHECK_EQ(3, processed);

  CHECK_EQ(+Double::Infinity(),
           converter.StringToDouble("+Infinity", 9, &processed));
  CHECK_EQ(9, processed);

  CHECK_EQ(-Double::Infinity(),
           converter.StringToDouble("-INFinity", 9, &processed));
  CHECK_EQ(9, processed);

  CHECK_EQ(Double::Infinity(),
           converter.StringToDouble("infINITY", 8, &processed));
  CHECK_EQ(8, processed);

  CHECK_EQ(1.0, converter.StringToDouble("INF", 3, &processed));
  CHECK_EQ(0, processed);

  CHECK_EQ(1.0, converter.StringToDouble("+inf", 4, &processed));
  CHECK_EQ(0, processed);
}
