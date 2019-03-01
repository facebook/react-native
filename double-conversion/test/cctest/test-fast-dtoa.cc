// Copyright 2006-2008 the V8 project authors. All rights reserved.

#include <stdlib.h>

#include "cctest.h"
#include "double-conversion/diy-fp.h"
#include "double-conversion/fast-dtoa.h"
#include "gay-precision.h"
#include "gay-shortest.h"
#include "gay-shortest-single.h"
#include "double-conversion/ieee.h"
#include "double-conversion/utils.h"

using namespace double_conversion;

static const int kBufferSize = 100;


// Removes trailing '0' digits.
static void TrimRepresentation(Vector<char> representation) {
  int len = strlen(representation.start());
  int i;
  for (i = len - 1; i >= 0; --i) {
    if (representation[i] != '0') break;
  }
  representation[i + 1] = '\0';
}


TEST(FastDtoaShortestVariousDoubles) {
  char buffer_container[kBufferSize];
  Vector<char> buffer(buffer_container, kBufferSize);
  int length;
  int point;
  bool status;

  double min_double = 5e-324;
  status = FastDtoa(min_double, FAST_DTOA_SHORTEST, 0,
                    buffer, &length, &point);
  CHECK(status);
  CHECK_EQ("5", buffer.start());
  CHECK_EQ(-323, point);

  double max_double = 1.7976931348623157e308;
  status = FastDtoa(max_double, FAST_DTOA_SHORTEST, 0,
                    buffer, &length, &point);
  CHECK(status);
  CHECK_EQ("17976931348623157", buffer.start());
  CHECK_EQ(309, point);

  status = FastDtoa(4294967272.0, FAST_DTOA_SHORTEST, 0,
                    buffer, &length, &point);
  CHECK(status);
  CHECK_EQ("4294967272", buffer.start());
  CHECK_EQ(10, point);

  status = FastDtoa(4.1855804968213567e298, FAST_DTOA_SHORTEST, 0,
                    buffer, &length, &point);
  CHECK(status);
  CHECK_EQ("4185580496821357", buffer.start());
  CHECK_EQ(299, point);

  status = FastDtoa(5.5626846462680035e-309, FAST_DTOA_SHORTEST, 0,
                    buffer, &length, &point);
  CHECK(status);
  CHECK_EQ("5562684646268003", buffer.start());
  CHECK_EQ(-308, point);

  status = FastDtoa(2147483648.0, FAST_DTOA_SHORTEST, 0,
                    buffer, &length, &point);
  CHECK(status);
  CHECK_EQ("2147483648", buffer.start());
  CHECK_EQ(10, point);

  status = FastDtoa(3.5844466002796428e+298, FAST_DTOA_SHORTEST, 0,
                    buffer, &length, &point);
  if (status) {  // Not all FastDtoa variants manage to compute this number.
    CHECK_EQ("35844466002796428", buffer.start());
    CHECK_EQ(299, point);
  }

  uint64_t smallest_normal64 = UINT64_2PART_C(0x00100000, 00000000);
  double v = Double(smallest_normal64).value();
  status = FastDtoa(v, FAST_DTOA_SHORTEST, 0, buffer, &length, &point);
  if (status) {
    CHECK_EQ("22250738585072014", buffer.start());
    CHECK_EQ(-307, point);
  }

  uint64_t largest_denormal64 = UINT64_2PART_C(0x000FFFFF, FFFFFFFF);
  v = Double(largest_denormal64).value();
  status = FastDtoa(v, FAST_DTOA_SHORTEST, 0, buffer, &length, &point);
  if (status) {
    CHECK_EQ("2225073858507201", buffer.start());
    CHECK_EQ(-307, point);
  }
}


TEST(FastDtoaShortestVariousFloats) {
  char buffer_container[kBufferSize];
  Vector<char> buffer(buffer_container, kBufferSize);
  int length;
  int point;
  bool status;

  float min_float = 1e-45f;
  status = FastDtoa(min_float, FAST_DTOA_SHORTEST_SINGLE, 0,
                    buffer, &length, &point);
  CHECK(status);
  CHECK_EQ("1", buffer.start());
  CHECK_EQ(-44, point);


  float max_float = 3.4028234e38f;
  status = FastDtoa(max_float, FAST_DTOA_SHORTEST_SINGLE, 0,
                    buffer, &length, &point);
  CHECK(status);
  CHECK_EQ("34028235", buffer.start());
  CHECK_EQ(39, point);

  status = FastDtoa(4294967272.0f, FAST_DTOA_SHORTEST_SINGLE, 0,
                    buffer, &length, &point);
  CHECK(status);
  CHECK_EQ("42949673", buffer.start());
  CHECK_EQ(10, point);

  status = FastDtoa(3.32306998946228968226e+35f, FAST_DTOA_SHORTEST_SINGLE, 0,
                    buffer, &length, &point);
  CHECK(status);
  CHECK_EQ("332307", buffer.start());
  CHECK_EQ(36, point);

  status = FastDtoa(1.2341e-41f, FAST_DTOA_SHORTEST_SINGLE, 0,
                    buffer, &length, &point);
  CHECK(status);
  CHECK_EQ("12341", buffer.start());
  CHECK_EQ(-40, point);

  status = FastDtoa(3.3554432e7, FAST_DTOA_SHORTEST_SINGLE, 0,
                    buffer, &length, &point);
  CHECK(status);
  CHECK_EQ("33554432", buffer.start());
  CHECK_EQ(8, point);

  status = FastDtoa(3.26494756798464e14f, FAST_DTOA_SHORTEST_SINGLE, 0,
                    buffer, &length, &point);
  CHECK(status);
  CHECK_EQ("32649476", buffer.start());
  CHECK_EQ(15, point);

  status = FastDtoa(3.91132223637771935344e37f, FAST_DTOA_SHORTEST_SINGLE, 0,
                    buffer, &length, &point);
  if (status) {  // Not all FastDtoa variants manage to compute this number.
    CHECK_EQ("39113222", buffer.start());
    CHECK_EQ(38, point);
  }

  uint32_t smallest_normal32 = 0x00800000;
  float v = Single(smallest_normal32).value();
  status = FastDtoa(v, FAST_DTOA_SHORTEST_SINGLE, 0, buffer, &length, &point);
  if (status) {
    CHECK_EQ("11754944", buffer.start());
    CHECK_EQ(-37, point);
  }

  uint32_t largest_denormal32 = 0x007FFFFF;
  v = Single(largest_denormal32).value();
  status = FastDtoa(v, FAST_DTOA_SHORTEST_SINGLE, 0, buffer, &length, &point);
  CHECK(status);
  CHECK_EQ("11754942", buffer.start());
  CHECK_EQ(-37, point);
}


TEST(FastDtoaPrecisionVariousDoubles) {
  char buffer_container[kBufferSize];
  Vector<char> buffer(buffer_container, kBufferSize);
  int length;
  int point;
  bool status;

  status = FastDtoa(1.0, FAST_DTOA_PRECISION, 3, buffer, &length, &point);
  CHECK(status);
  CHECK(3 >= length);
  TrimRepresentation(buffer);
  CHECK_EQ("1", buffer.start());
  CHECK_EQ(1, point);

  status = FastDtoa(1.5, FAST_DTOA_PRECISION, 10, buffer, &length, &point);
  if (status) {
    CHECK(10 >= length);
    TrimRepresentation(buffer);
    CHECK_EQ("15", buffer.start());
    CHECK_EQ(1, point);
  }

  double min_double = 5e-324;
  status = FastDtoa(min_double, FAST_DTOA_PRECISION, 5,
                    buffer, &length, &point);
  CHECK(status);
  CHECK_EQ("49407", buffer.start());
  CHECK_EQ(-323, point);

  double max_double = 1.7976931348623157e308;
  status = FastDtoa(max_double, FAST_DTOA_PRECISION, 7,
                    buffer, &length, &point);
  CHECK(status);
  CHECK_EQ("1797693", buffer.start());
  CHECK_EQ(309, point);

  status = FastDtoa(4294967272.0, FAST_DTOA_PRECISION, 14,
                    buffer, &length, &point);
  if (status) {
    CHECK(14 >= length);
    TrimRepresentation(buffer);
    CHECK_EQ("4294967272", buffer.start());
    CHECK_EQ(10, point);
  }

  status = FastDtoa(4.1855804968213567e298, FAST_DTOA_PRECISION, 17,
                    buffer, &length, &point);
  CHECK(status);
  CHECK_EQ("41855804968213567", buffer.start());
  CHECK_EQ(299, point);

  status = FastDtoa(5.5626846462680035e-309, FAST_DTOA_PRECISION, 1,
                    buffer, &length, &point);
  CHECK(status);
  CHECK_EQ("6", buffer.start());
  CHECK_EQ(-308, point);

  status = FastDtoa(2147483648.0, FAST_DTOA_PRECISION, 5,
                    buffer, &length, &point);
  CHECK(status);
  CHECK_EQ("21475", buffer.start());
  CHECK_EQ(10, point);

  status = FastDtoa(3.5844466002796428e+298, FAST_DTOA_PRECISION, 10,
                    buffer, &length, &point);
  CHECK(status);
  CHECK(10 >= length);
  TrimRepresentation(buffer);
  CHECK_EQ("35844466", buffer.start());
  CHECK_EQ(299, point);

  uint64_t smallest_normal64 = UINT64_2PART_C(0x00100000, 00000000);
  double v = Double(smallest_normal64).value();
  status = FastDtoa(v, FAST_DTOA_PRECISION, 17, buffer, &length, &point);
  CHECK(status);
  CHECK_EQ("22250738585072014", buffer.start());
  CHECK_EQ(-307, point);

  uint64_t largest_denormal64 = UINT64_2PART_C(0x000FFFFF, FFFFFFFF);
  v = Double(largest_denormal64).value();
  status = FastDtoa(v, FAST_DTOA_PRECISION, 17, buffer, &length, &point);
  CHECK(status);
  CHECK(20 >= length);
  TrimRepresentation(buffer);
  CHECK_EQ("22250738585072009", buffer.start());
  CHECK_EQ(-307, point);

  v = 3.3161339052167390562200598e-237;
  status = FastDtoa(v, FAST_DTOA_PRECISION, 18, buffer, &length, &point);
  CHECK(status);
  CHECK_EQ("331613390521673906", buffer.start());
  CHECK_EQ(-236, point);

  v = 7.9885183916008099497815232e+191;
  status = FastDtoa(v, FAST_DTOA_PRECISION, 4, buffer, &length, &point);
  CHECK(status);
  CHECK_EQ("7989", buffer.start());
  CHECK_EQ(192, point);
}


TEST(FastDtoaGayShortest) {
  char buffer_container[kBufferSize];
  Vector<char> buffer(buffer_container, kBufferSize);
  bool status;
  int length;
  int point;
  int succeeded = 0;
  int total = 0;
  bool needed_max_length = false;

  Vector<const PrecomputedShortest> precomputed =
      PrecomputedShortestRepresentations();
  for (int i = 0; i < precomputed.length(); ++i) {
    const PrecomputedShortest current_test = precomputed[i];
    total++;
    double v = current_test.v;
    status = FastDtoa(v, FAST_DTOA_SHORTEST, 0, buffer, &length, &point);
    CHECK(kFastDtoaMaximalLength >= length);
    if (!status) continue;
    if (length == kFastDtoaMaximalLength) needed_max_length = true;
    succeeded++;
    CHECK_EQ(current_test.decimal_point, point);
    CHECK_EQ(current_test.representation, buffer.start());
  }
  CHECK(succeeded*1.0/total > 0.99);
  CHECK(needed_max_length);
}


TEST(FastDtoaGayShortestSingle) {
  char buffer_container[kBufferSize];
  Vector<char> buffer(buffer_container, kBufferSize);
  bool status;
  int length;
  int point;
  int succeeded = 0;
  int total = 0;
  bool needed_max_length = false;

  Vector<const PrecomputedShortestSingle> precomputed =
      PrecomputedShortestSingleRepresentations();
  for (int i = 0; i < precomputed.length(); ++i) {
    const PrecomputedShortestSingle current_test = precomputed[i];
    total++;
    float v = current_test.v;
    status = FastDtoa(v, FAST_DTOA_SHORTEST_SINGLE, 0, buffer, &length, &point);
    CHECK(kFastDtoaMaximalSingleLength >= length);
    if (!status) continue;
    if (length == kFastDtoaMaximalSingleLength) needed_max_length = true;
    succeeded++;
    CHECK_EQ(current_test.decimal_point, point);
    CHECK_EQ(current_test.representation, buffer.start());
  }
  CHECK(succeeded*1.0/total > 0.98);
  CHECK(needed_max_length);
}


TEST(FastDtoaGayPrecision) {
  char buffer_container[kBufferSize];
  Vector<char> buffer(buffer_container, kBufferSize);
  bool status;
  int length;
  int point;
  int succeeded = 0;
  int total = 0;
  // Count separately for entries with less than 15 requested digits.
  int succeeded_15 = 0;
  int total_15 = 0;

  Vector<const PrecomputedPrecision> precomputed =
      PrecomputedPrecisionRepresentations();
  for (int i = 0; i < precomputed.length(); ++i) {
    const PrecomputedPrecision current_test = precomputed[i];
    double v = current_test.v;
    int number_digits = current_test.number_digits;
    total++;
    if (number_digits <= 15) total_15++;
    status = FastDtoa(v, FAST_DTOA_PRECISION, number_digits,
                      buffer, &length, &point);
    CHECK(number_digits >= length);
    if (!status) continue;
    succeeded++;
    if (number_digits <= 15) succeeded_15++;
    TrimRepresentation(buffer);
    CHECK_EQ(current_test.decimal_point, point);
    CHECK_EQ(current_test.representation, buffer.start());
  }
  // The precomputed numbers contain many entries with many requested
  // digits. These have a high failure rate and we therefore expect a lower
  // success rate than for the shortest representation.
  CHECK(succeeded*1.0/total > 0.85);
  // However with less than 15 digits almost the algorithm should almost always
  // succeed.
  CHECK(succeeded_15*1.0/total_15 > 0.9999);
}
