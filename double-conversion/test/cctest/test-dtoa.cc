// Copyright 2010 the V8 project authors. All rights reserved.
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

#include <stdlib.h>

#include "double-conversion/double-conversion.h"

#include "cctest.h"
#include "gay-fixed.h"
#include "gay-precision.h"
#include "gay-shortest.h"
#include "gay-shortest-single.h"
#include "double-conversion/ieee.h"


using namespace double_conversion;


enum DtoaMode {
  SHORTEST,
  SHORTEST_SINGLE,
  FIXED,
  PRECISION
};

static void DoubleToAscii(double v, DtoaMode test_mode, int requested_digits,
                          Vector<char> buffer, bool* sign, int* length,
                          int* point) {
  DoubleToStringConverter::DtoaMode mode = DoubleToStringConverter::SHORTEST;
  switch (test_mode) {
    case SHORTEST: mode = DoubleToStringConverter::SHORTEST; break;
    case SHORTEST_SINGLE:
        mode = DoubleToStringConverter::SHORTEST_SINGLE;
        break;
    case FIXED: mode = DoubleToStringConverter::FIXED; break;
    case PRECISION: mode = DoubleToStringConverter::PRECISION; break;
  }
  DoubleToStringConverter::DoubleToAscii(v, mode, requested_digits,
                                 buffer.start(), buffer.length(),
                                 sign, length, point);
}

// Removes trailing '0' digits.
static void TrimRepresentation(Vector<char> representation) {
  int len = strlen(representation.start());
  int i;
  for (i = len - 1; i >= 0; --i) {
    if (representation[i] != '0') break;
  }
  representation[i + 1] = '\0';
}


static const int kBufferSize = 100;


TEST(DtoaVariousDoubles) {
  char buffer_container[kBufferSize];
  Vector<char> buffer(buffer_container, kBufferSize);
  int length;
  int point;
  bool sign;

  DoubleToAscii(0.0, SHORTEST, 0, buffer, &sign, &length, &point);
  CHECK_EQ("0", buffer.start());
  CHECK_EQ(1, point);

  DoubleToAscii(0.0f, SHORTEST_SINGLE, 0, buffer, &sign, &length, &point);
  CHECK_EQ("0", buffer.start());
  CHECK_EQ(1, point);

  DoubleToAscii(0.0, FIXED, 2, buffer, &sign, &length, &point);
  CHECK_EQ(1, length);
  CHECK_EQ("0", buffer.start());
  CHECK_EQ(1, point);

  DoubleToAscii(0.0, PRECISION, 3, buffer, &sign, &length, &point);
  CHECK_EQ(1, length);
  CHECK_EQ("0", buffer.start());
  CHECK_EQ(1, point);

  DoubleToAscii(1.0, SHORTEST, 0, buffer, &sign, &length, &point);
  CHECK_EQ("1", buffer.start());
  CHECK_EQ(1, point);

  DoubleToAscii(1.0f, SHORTEST_SINGLE, 0, buffer, &sign, &length, &point);
  CHECK_EQ("1", buffer.start());
  CHECK_EQ(1, point);

  DoubleToAscii(1.0, FIXED, 3, buffer, &sign, &length, &point);
  CHECK_GE(3, length - point);
  TrimRepresentation(buffer);
  CHECK_EQ("1", buffer.start());
  CHECK_EQ(1, point);

  DoubleToAscii(1.0, PRECISION, 3, buffer, &sign, &length, &point);
  CHECK_GE(3, length);
  TrimRepresentation(buffer);
  CHECK_EQ("1", buffer.start());
  CHECK_EQ(1, point);

  DoubleToAscii(1.5, SHORTEST, 0, buffer, &sign, &length, &point);
  CHECK_EQ("15", buffer.start());
  CHECK_EQ(1, point);

  DoubleToAscii(1.5f, SHORTEST_SINGLE, 0, buffer, &sign, &length, &point);
  CHECK_EQ("15", buffer.start());
  CHECK_EQ(1, point);

  DoubleToAscii(1.5, FIXED, 10, buffer, &sign, &length, &point);
  CHECK_GE(10, length - point);
  TrimRepresentation(buffer);
  CHECK_EQ("15", buffer.start());
  CHECK_EQ(1, point);

  DoubleToAscii(1.5, PRECISION, 10, buffer, &sign, &length, &point);
  CHECK_GE(10, length);
  TrimRepresentation(buffer);
  CHECK_EQ("15", buffer.start());
  CHECK_EQ(1, point);

  double min_double = 5e-324;
  DoubleToAscii(min_double, SHORTEST, 0, buffer, &sign, &length, &point);
  CHECK_EQ("5", buffer.start());
  CHECK_EQ(-323, point);

  float min_float = 1e-45f;
  DoubleToAscii(min_float, SHORTEST_SINGLE, 0, buffer, &sign, &length, &point);
  CHECK_EQ("1", buffer.start());
  CHECK_EQ(-44, point);

  DoubleToAscii(min_double, FIXED, 5, buffer, &sign, &length, &point);
  CHECK_GE(5, length - point);
  TrimRepresentation(buffer);
  CHECK_EQ("", buffer.start());
  CHECK_GE(-5, point);

  DoubleToAscii(min_double, PRECISION, 5, buffer, &sign, &length, &point);
  CHECK_GE(5, length);
  TrimRepresentation(buffer);
  CHECK_EQ("49407", buffer.start());
  CHECK_EQ(-323, point);

  double max_double = 1.7976931348623157e308;
  DoubleToAscii(max_double, SHORTEST, 0, buffer, &sign, &length, &point);
  CHECK_EQ("17976931348623157", buffer.start());
  CHECK_EQ(309, point);

  float max_float = 3.4028234e38f;
  DoubleToAscii(max_float, SHORTEST_SINGLE, 0,
                buffer, &sign, &length, &point);
  CHECK_EQ("34028235", buffer.start());
  CHECK_EQ(39, point);

  DoubleToAscii(max_double, PRECISION, 7, buffer, &sign, &length, &point);
  CHECK_GE(7, length);
  TrimRepresentation(buffer);
  CHECK_EQ("1797693", buffer.start());
  CHECK_EQ(309, point);

  DoubleToAscii(4294967272.0, SHORTEST, 0, buffer, &sign, &length, &point);
  CHECK_EQ("4294967272", buffer.start());
  CHECK_EQ(10, point);

  DoubleToAscii(4294967272.0f, SHORTEST_SINGLE, 0, buffer, &sign, &length, &point);
  CHECK_EQ("42949673", buffer.start());
  CHECK_EQ(10, point);

  DoubleToAscii(4294967272.0, FIXED, 5, buffer, &sign, &length, &point);
  CHECK_GE(5, length - point);
  TrimRepresentation(buffer);
  CHECK_EQ("4294967272", buffer.start());
  CHECK_EQ(10, point);

  DoubleToAscii(4294967272.0, PRECISION, 14,
                buffer, &sign, &length, &point);
  CHECK_GE(14, length);
  TrimRepresentation(buffer);
  CHECK_EQ("4294967272", buffer.start());
  CHECK_EQ(10, point);

  DoubleToAscii(4.1855804968213567e298, SHORTEST, 0,
                buffer, &sign, &length, &point);
  CHECK_EQ("4185580496821357", buffer.start());
  CHECK_EQ(299, point);

  DoubleToAscii(4.1855804968213567e298, PRECISION, 20,
                buffer, &sign, &length, &point);
  CHECK_GE(20, length);
  TrimRepresentation(buffer);
  CHECK_EQ("41855804968213567225", buffer.start());
  CHECK_EQ(299, point);

  DoubleToAscii(5.5626846462680035e-309, SHORTEST, 0,
                buffer, &sign, &length, &point);
  CHECK_EQ("5562684646268003", buffer.start());
  CHECK_EQ(-308, point);

  DoubleToAscii(5.5626846462680035e-309, PRECISION, 1,
                buffer, &sign, &length, &point);
  CHECK_GE(1, length);
  TrimRepresentation(buffer);
  CHECK_EQ("6", buffer.start());
  CHECK_EQ(-308, point);

  DoubleToAscii(-2147483648.0, SHORTEST, 0,
                buffer, &sign, &length, &point);
  CHECK_EQ(1, sign);
  CHECK_EQ("2147483648", buffer.start());
  CHECK_EQ(10, point);

  DoubleToAscii(-2147483648.0, SHORTEST_SINGLE, 0,
                buffer, &sign, &length, &point);
  CHECK_EQ(1, sign);
  CHECK_EQ("21474836", buffer.start());
  CHECK_EQ(10, point);


  DoubleToAscii(-2147483648.0, FIXED, 2, buffer, &sign, &length, &point);
  CHECK_GE(2, length - point);
  TrimRepresentation(buffer);
  CHECK_EQ(1, sign);
  CHECK_EQ("2147483648", buffer.start());
  CHECK_EQ(10, point);

  DoubleToAscii(-2147483648.0, PRECISION, 5,
                buffer, &sign, &length, &point);
  CHECK_GE(5, length);
  TrimRepresentation(buffer);
  CHECK_EQ(1, sign);
  CHECK_EQ("21475", buffer.start());
  CHECK_EQ(10, point);

  DoubleToAscii(-3.5844466002796428e+298, SHORTEST, 0,
                buffer, &sign, &length, &point);
  CHECK_EQ(1, sign);
  CHECK_EQ("35844466002796428", buffer.start());
  CHECK_EQ(299, point);

  DoubleToAscii(-3.5844466002796428e+298, PRECISION, 10,
                buffer, &sign, &length, &point);
  CHECK_EQ(1, sign);
  CHECK_GE(10, length);
  TrimRepresentation(buffer);
  CHECK_EQ("35844466", buffer.start());
  CHECK_EQ(299, point);

  uint64_t smallest_normal64 = UINT64_2PART_C(0x00100000, 00000000);
  double v = Double(smallest_normal64).value();
  DoubleToAscii(v, SHORTEST, 0, buffer, &sign, &length, &point);
  CHECK_EQ("22250738585072014", buffer.start());
  CHECK_EQ(-307, point);

  uint32_t smallest_normal32 = 0x00800000;
  float f = Single(smallest_normal32).value();
  DoubleToAscii(f, SHORTEST_SINGLE, 0, buffer, &sign, &length, &point);
  CHECK_EQ("11754944", buffer.start());
  CHECK_EQ(-37, point);

  DoubleToAscii(v, PRECISION, 20, buffer, &sign, &length, &point);
  CHECK_GE(20, length);
  TrimRepresentation(buffer);
  CHECK_EQ("22250738585072013831", buffer.start());
  CHECK_EQ(-307, point);

  uint64_t largest_denormal64 = UINT64_2PART_C(0x000FFFFF, FFFFFFFF);
  v = Double(largest_denormal64).value();
  DoubleToAscii(v, SHORTEST, 0, buffer, &sign, &length, &point);
  CHECK_EQ("2225073858507201", buffer.start());
  CHECK_EQ(-307, point);

  uint32_t largest_denormal32 = 0x007FFFFF;
  f = Single(largest_denormal32).value();
  DoubleToAscii(f, SHORTEST_SINGLE, 0, buffer, &sign, &length, &point);
  CHECK_EQ("11754942", buffer.start());
  CHECK_EQ(-37, point);

  DoubleToAscii(v, PRECISION, 20, buffer, &sign, &length, &point);
  CHECK_GE(20, length);
  TrimRepresentation(buffer);
  CHECK_EQ("2225073858507200889", buffer.start());
  CHECK_EQ(-307, point);

  DoubleToAscii(4128420500802942e-24, SHORTEST, 0,
                buffer, &sign, &length, &point);
  CHECK_EQ(0, sign);
  CHECK_EQ("4128420500802942", buffer.start());
  CHECK_EQ(-8, point);

  v = -3.9292015898194142585311918e-10;
  DoubleToAscii(v, SHORTEST, 0, buffer, &sign, &length, &point);
  CHECK_EQ("39292015898194143", buffer.start());

  f = -3.9292015898194142585311918e-10f;
  DoubleToAscii(f, SHORTEST_SINGLE, 0, buffer, &sign, &length, &point);
  CHECK_EQ("39292017", buffer.start());

  v = 4194304.0;
  DoubleToAscii(v, FIXED, 5, buffer, &sign, &length, &point);
  CHECK_GE(5, length - point);
  TrimRepresentation(buffer);
  CHECK_EQ("4194304", buffer.start());

  v = 3.3161339052167390562200598e-237;
  DoubleToAscii(v, PRECISION, 19, buffer, &sign, &length, &point);
  CHECK_GE(19, length);
  TrimRepresentation(buffer);
  CHECK_EQ("3316133905216739056", buffer.start());
  CHECK_EQ(-236, point);
}


TEST(DtoaSign) {
  char buffer_container[kBufferSize];
  Vector<char> buffer(buffer_container, kBufferSize);
  bool sign;
  int length;
  int point;

  DoubleToAscii(0.0, SHORTEST, 0, buffer, &sign, &length, &point);
  CHECK(!sign);

  DoubleToAscii(-0.0, SHORTEST, 0, buffer, &sign, &length, &point);
  CHECK(sign);

  DoubleToAscii(1.0, SHORTEST, 0, buffer, &sign, &length, &point);
  CHECK(!sign);

  DoubleToAscii(-1.0, SHORTEST, 0, buffer, &sign, &length, &point);
  CHECK(sign);

  DoubleToAscii(0.0f, SHORTEST_SINGLE, 0, buffer, &sign, &length, &point);
  CHECK(!sign);

  DoubleToAscii(-0.0f, SHORTEST_SINGLE, 0, buffer, &sign, &length, &point);
  CHECK(sign);

  DoubleToAscii(1.0f, SHORTEST_SINGLE, 0, buffer, &sign, &length, &point);
  CHECK(!sign);

  DoubleToAscii(-1.0f, SHORTEST_SINGLE, 0, buffer, &sign, &length, &point);
  CHECK(sign);

  DoubleToAscii(0.0, PRECISION, 1, buffer, &sign, &length, &point);
  CHECK(!sign);

  DoubleToAscii(-0.0, PRECISION, 1, buffer, &sign, &length, &point);
  CHECK(sign);

  DoubleToAscii(1.0, PRECISION, 1, buffer, &sign, &length, &point);
  CHECK(!sign);

  DoubleToAscii(-1.0, PRECISION, 1, buffer, &sign, &length, &point);
  CHECK(sign);

  DoubleToAscii(0.0, FIXED, 1, buffer, &sign, &length, &point);
  CHECK(!sign);

  DoubleToAscii(-0.0, FIXED, 1, buffer, &sign, &length, &point);
  CHECK(sign);

  DoubleToAscii(1.0, FIXED, 1, buffer, &sign, &length, &point);
  CHECK(!sign);

  DoubleToAscii(-1.0, FIXED, 1, buffer, &sign, &length, &point);
  CHECK(sign);
}


TEST(DtoaCorners) {
  char buffer_container[kBufferSize];
  Vector<char> buffer(buffer_container, kBufferSize);
  bool sign;
  int length;
  int point;

  DoubleToAscii(0.0, PRECISION, 0, buffer, &sign, &length, &point);
  CHECK_EQ(0, length);
  CHECK_EQ("", buffer.start());
  CHECK(!sign);

  DoubleToAscii(1.0, PRECISION, 0, buffer, &sign, &length, &point);
  CHECK_EQ(0, length);
  CHECK_EQ("", buffer.start());
  CHECK(!sign);

  DoubleToAscii(0.0, FIXED, 0, buffer, &sign, &length, &point);
  CHECK_EQ(1, length);
  CHECK_EQ("0", buffer.start());
  CHECK(!sign);

  DoubleToAscii(1.0, FIXED, 0, buffer, &sign, &length, &point);
  CHECK_EQ(1, length);
  CHECK_EQ("1", buffer.start());
  CHECK(!sign);
}


TEST(DtoaGayShortest) {
  char buffer_container[kBufferSize];
  Vector<char> buffer(buffer_container, kBufferSize);
  bool sign;
  int length;
  int point;

  Vector<const PrecomputedShortest> precomputed =
      PrecomputedShortestRepresentations();
  for (int i = 0; i < precomputed.length(); ++i) {
    const PrecomputedShortest current_test = precomputed[i];
    double v = current_test.v;
    DoubleToAscii(v, SHORTEST, 0, buffer, &sign, &length, &point);
    CHECK(!sign);  // All precomputed numbers are positive.
    CHECK_EQ(current_test.decimal_point, point);
    CHECK_EQ(current_test.representation, buffer.start());
  }
}


TEST(DtoaGayShortestSingle) {
  char buffer_container[kBufferSize];
  Vector<char> buffer(buffer_container, kBufferSize);
  bool sign;
  int length;
  int point;

  Vector<const PrecomputedShortestSingle> precomputed =
      PrecomputedShortestSingleRepresentations();
  for (int i = 0; i < precomputed.length(); ++i) {
    const PrecomputedShortestSingle current_test = precomputed[i];
    float v = current_test.v;
    DoubleToAscii(v, SHORTEST_SINGLE, 0, buffer, &sign, &length, &point);
    CHECK(!sign);  // All precomputed numbers are positive.
    CHECK_EQ(current_test.decimal_point, point);
    CHECK_EQ(current_test.representation, buffer.start());
  }
}


TEST(DtoaGayFixed) {
  char buffer_container[kBufferSize];
  Vector<char> buffer(buffer_container, kBufferSize);
  bool sign;
  int length;
  int point;

  Vector<const PrecomputedFixed> precomputed =
      PrecomputedFixedRepresentations();
  for (int i = 0; i < precomputed.length(); ++i) {
    const PrecomputedFixed current_test = precomputed[i];
    double v = current_test.v;
    int number_digits = current_test.number_digits;
    DoubleToAscii(v, FIXED, number_digits, buffer, &sign, &length, &point);
    CHECK(!sign);  // All precomputed numbers are positive.
    CHECK_EQ(current_test.decimal_point, point);
    CHECK_GE(number_digits, length - point);
    TrimRepresentation(buffer);
    CHECK_EQ(current_test.representation, buffer.start());
  }
}


TEST(DtoaGayPrecision) {
  char buffer_container[kBufferSize];
  Vector<char> buffer(buffer_container, kBufferSize);
  bool sign;
  int length;
  int point;

  Vector<const PrecomputedPrecision> precomputed =
      PrecomputedPrecisionRepresentations();
  for (int i = 0; i < precomputed.length(); ++i) {
    const PrecomputedPrecision current_test = precomputed[i];
    double v = current_test.v;
    int number_digits = current_test.number_digits;
    DoubleToAscii(v, PRECISION, number_digits,
                  buffer, &sign, &length, &point);
    CHECK(!sign);  // All precomputed numbers are positive.
    CHECK_EQ(current_test.decimal_point, point);
    CHECK_GE(number_digits, length);
    TrimRepresentation(buffer);
    CHECK_EQ(current_test.representation, buffer.start());
  }
}
