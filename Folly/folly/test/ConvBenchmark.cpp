/*
 * Copyright 2016-present Facebook, Inc.
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

#include <folly/Conv.h>

#include <boost/lexical_cast.hpp>

#include <folly/Benchmark.h>
#include <folly/CppAttributes.h>
#include <folly/container/Foreach.h>

#include <array>
#include <limits>
#include <stdexcept>

using namespace std;
using namespace folly;

// Android doesn't support std::to_string so just use a placeholder there.
#ifdef __ANDROID__
#define FOLLY_RANGE_CHECK_TO_STRING(x) std::string("N/A")
#else
#define FOLLY_RANGE_CHECK_TO_STRING(x) std::to_string(x)
#endif

namespace folly {
namespace conv_bench_detail {

// Keep this data global and non-const, so the compiler cannot make
// any assumptions about the actual values at compile time

uint64_t uint64Num[] = {
    0,
    1ULL,
    12ULL,
    123ULL,
    1234ULL,
    12345ULL,
    123456ULL,
    1234567ULL,
    12345678ULL,
    123456789ULL,
    1234567890ULL,
    12345678901ULL,
    123456789012ULL,
    1234567890123ULL,
    12345678901234ULL,
    123456789012345ULL,
    1234567890123456ULL,
    12345678901234567ULL,
    123456789012345678ULL,
    1234567890123456789ULL,
    12345678901234567890ULL,
};

int64_t int64Pos[] = {
    0,
    1LL,
    12LL,
    123LL,
    1234LL,
    12345LL,
    123456LL,
    1234567LL,
    12345678LL,
    123456789LL,
    1234567890LL,
    12345678901LL,
    123456789012LL,
    1234567890123LL,
    12345678901234LL,
    123456789012345LL,
    1234567890123456LL,
    12345678901234567LL,
    123456789012345678LL,
    1234567890123456789LL,
};

int64_t int64Neg[] = {
    0,
    -1LL,
    -12LL,
    -123LL,
    -1234LL,
    -12345LL,
    -123456LL,
    -1234567LL,
    -12345678LL,
    -123456789LL,
    -1234567890LL,
    -12345678901LL,
    -123456789012LL,
    -1234567890123LL,
    -12345678901234LL,
    -123456789012345LL,
    -1234567890123456LL,
    -12345678901234567LL,
    -123456789012345678LL,
    -1234567890123456789LL,
};

#if FOLLY_HAVE_INT128_T

unsigned __int128 uint128Num[] = {
    0,
    static_cast<unsigned __int128>(1) << 0,
    static_cast<unsigned __int128>(1) << 4,
    static_cast<unsigned __int128>(1) << 7,
    static_cast<unsigned __int128>(1) << 10,
    static_cast<unsigned __int128>(1) << 14,
    static_cast<unsigned __int128>(1) << 17,
    static_cast<unsigned __int128>(1) << 20,
    static_cast<unsigned __int128>(1) << 24,
    static_cast<unsigned __int128>(1) << 27,
    static_cast<unsigned __int128>(1) << 30,
    static_cast<unsigned __int128>(1) << 34,
    static_cast<unsigned __int128>(1) << 37,
    static_cast<unsigned __int128>(1) << 40,
    static_cast<unsigned __int128>(1) << 44,
    static_cast<unsigned __int128>(1) << 47,
    static_cast<unsigned __int128>(1) << 50,
    static_cast<unsigned __int128>(1) << 54,
    static_cast<unsigned __int128>(1) << 57,
    static_cast<unsigned __int128>(1) << 60,
    static_cast<unsigned __int128>(1) << 64,
    static_cast<unsigned __int128>(1) << 67,
    static_cast<unsigned __int128>(1) << 70,
    static_cast<unsigned __int128>(1) << 74,
    static_cast<unsigned __int128>(1) << 77,
    static_cast<unsigned __int128>(1) << 80,
    static_cast<unsigned __int128>(1) << 84,
    static_cast<unsigned __int128>(1) << 87,
    static_cast<unsigned __int128>(1) << 90,
    static_cast<unsigned __int128>(1) << 94,
    static_cast<unsigned __int128>(1) << 97,
    static_cast<unsigned __int128>(1) << 100,
    static_cast<unsigned __int128>(1) << 103,
    static_cast<unsigned __int128>(1) << 107,
    static_cast<unsigned __int128>(1) << 110,
    static_cast<unsigned __int128>(1) << 113,
    static_cast<unsigned __int128>(1) << 117,
    static_cast<unsigned __int128>(1) << 120,
    static_cast<unsigned __int128>(1) << 123,
    static_cast<unsigned __int128>(1) << 127,
};

__int128 int128Pos[] = {
    0,
    static_cast<__int128>(1) << 0,
    static_cast<__int128>(1) << 4,
    static_cast<__int128>(1) << 7,
    static_cast<__int128>(1) << 10,
    static_cast<__int128>(1) << 14,
    static_cast<__int128>(1) << 17,
    static_cast<__int128>(1) << 20,
    static_cast<__int128>(1) << 24,
    static_cast<__int128>(1) << 27,
    static_cast<__int128>(1) << 30,
    static_cast<__int128>(1) << 34,
    static_cast<__int128>(1) << 37,
    static_cast<__int128>(1) << 40,
    static_cast<__int128>(1) << 44,
    static_cast<__int128>(1) << 47,
    static_cast<__int128>(1) << 50,
    static_cast<__int128>(1) << 54,
    static_cast<__int128>(1) << 57,
    static_cast<__int128>(1) << 60,
    static_cast<__int128>(1) << 64,
    static_cast<__int128>(1) << 67,
    static_cast<__int128>(1) << 70,
    static_cast<__int128>(1) << 74,
    static_cast<__int128>(1) << 77,
    static_cast<__int128>(1) << 80,
    static_cast<__int128>(1) << 84,
    static_cast<__int128>(1) << 87,
    static_cast<__int128>(1) << 90,
    static_cast<__int128>(1) << 94,
    static_cast<__int128>(1) << 97,
    static_cast<__int128>(1) << 100,
    static_cast<__int128>(1) << 103,
    static_cast<__int128>(1) << 107,
    static_cast<__int128>(1) << 110,
    static_cast<__int128>(1) << 113,
    static_cast<__int128>(1) << 117,
    static_cast<__int128>(1) << 120,
    static_cast<__int128>(1) << 123,
    static_cast<__int128>(3) << 125,
};

__int128 int128Neg[] = {
    0,
    -(static_cast<__int128>(1) << 0),
    -(static_cast<__int128>(1) << 4),
    -(static_cast<__int128>(1) << 7),
    -(static_cast<__int128>(1) << 10),
    -(static_cast<__int128>(1) << 14),
    -(static_cast<__int128>(1) << 17),
    -(static_cast<__int128>(1) << 20),
    -(static_cast<__int128>(1) << 24),
    -(static_cast<__int128>(1) << 27),
    -(static_cast<__int128>(1) << 30),
    -(static_cast<__int128>(1) << 34),
    -(static_cast<__int128>(1) << 37),
    -(static_cast<__int128>(1) << 40),
    -(static_cast<__int128>(1) << 44),
    -(static_cast<__int128>(1) << 47),
    -(static_cast<__int128>(1) << 50),
    -(static_cast<__int128>(1) << 54),
    -(static_cast<__int128>(1) << 57),
    -(static_cast<__int128>(1) << 60),
    -(static_cast<__int128>(1) << 64),
    -(static_cast<__int128>(1) << 67),
    -(static_cast<__int128>(1) << 70),
    -(static_cast<__int128>(1) << 74),
    -(static_cast<__int128>(1) << 77),
    -(static_cast<__int128>(1) << 80),
    -(static_cast<__int128>(1) << 84),
    -(static_cast<__int128>(1) << 87),
    -(static_cast<__int128>(1) << 90),
    -(static_cast<__int128>(1) << 94),
    -(static_cast<__int128>(1) << 97),
    -(static_cast<__int128>(1) << 100),
    -(static_cast<__int128>(1) << 103),
    -(static_cast<__int128>(1) << 107),
    -(static_cast<__int128>(1) << 110),
    -(static_cast<__int128>(1) << 113),
    -(static_cast<__int128>(1) << 117),
    -(static_cast<__int128>(1) << 120),
    -(static_cast<__int128>(1) << 123),
    -(static_cast<__int128>(3) << 125),
};

#endif
} // namespace conv_bench_detail
} // namespace folly

using namespace folly::conv_bench_detail;

namespace {

template <typename T>
void checkArrayIndex(const T& array, size_t index) {
  DCHECK_LT(index, sizeof(array) / sizeof(array[0]));
}
} // namespace

////////////////////////////////////////////////////////////////////////////////
// Benchmarks for ASCII to int conversion
////////////////////////////////////////////////////////////////////////////////
// @author: Rajat Goel (rajat)

static int64_t handwrittenAtoi(const char* start, const char* end) {
  bool positive = true;
  int64_t retVal = 0;

  if (start == end) {
    throw std::runtime_error("empty string");
  }

  while (start < end && isspace(*start)) {
    ++start;
  }

  switch (*start) {
    case '-':
      positive = false;
      FOLLY_FALLTHROUGH;
    case '+':
      ++start;
      FOLLY_FALLTHROUGH;
    default:
      break;
  }

  while (start < end && *start >= '0' && *start <= '9') {
    auto const newRetVal = retVal * 10 + (*start++ - '0');
    if (newRetVal < retVal) {
      throw std::runtime_error("overflow");
    }
    retVal = newRetVal;
  }

  if (start != end) {
    throw std::runtime_error("extra chars at the end");
  }

  return positive ? retVal : -retVal;
}

static StringPiece pc1 = "1234567890123456789";

void handwrittenAtoiMeasure(unsigned int n, unsigned int digits) {
  auto p = pc1.subpiece(pc1.size() - digits, digits);
  FOR_EACH_RANGE (i, 0, n) {
    doNotOptimizeAway(handwrittenAtoi(p.begin(), p.end()));
  }
}

void follyAtoiMeasure(unsigned int n, unsigned int digits) {
  auto p = pc1.subpiece(pc1.size() - digits, digits);
  FOR_EACH_RANGE (i, 0, n) {
    doNotOptimizeAway(folly::to<int64_t>(p.begin(), p.end()));
  }
}

void clibAtoiMeasure(unsigned int n, unsigned int digits) {
  auto p = pc1.subpiece(pc1.size() - digits, digits);
  assert(*p.end() == 0);
  FOR_EACH_RANGE (i, 0, n) { doNotOptimizeAway(atoll(p.begin())); }
}

void lexicalCastMeasure(unsigned int n, unsigned int digits) {
  auto p = pc1.subpiece(pc1.size() - digits, digits);
  assert(*p.end() == 0);
  FOR_EACH_RANGE (i, 0, n) {
    doNotOptimizeAway(boost::lexical_cast<uint64_t>(p.begin()));
  }
}

// Benchmarks for unsigned to string conversion, raw

unsigned u64ToAsciiTable(uint64_t value, char* dst) {
  static const char digits[201] =
      "00010203040506070809"
      "10111213141516171819"
      "20212223242526272829"
      "30313233343536373839"
      "40414243444546474849"
      "50515253545556575859"
      "60616263646566676869"
      "70717273747576777879"
      "80818283848586878889"
      "90919293949596979899";

  uint32_t const length = digits10(value);
  uint32_t next = length - 1;
  while (value >= 100) {
    auto const i = (value % 100) * 2;
    value /= 100;
    dst[next] = digits[i + 1];
    dst[next - 1] = digits[i];
    next -= 2;
  }
  // Handle last 1-2 digits
  if (value < 10) {
    dst[next] = '0' + uint32_t(value);
  } else {
    auto i = uint32_t(value) * 2;
    dst[next] = digits[i + 1];
    dst[next - 1] = digits[i];
  }
  return length;
}

void u64ToAsciiTableBM(unsigned int n, size_t index) {
  checkArrayIndex(uint64Num, index);
  char buf[20];
  FOR_EACH_RANGE (i, 0, n) {
    doNotOptimizeAway(u64ToAsciiTable(uint64Num[index] + (i % 8), buf));
  }
}

unsigned u64ToAsciiClassic(uint64_t value, char* dst) {
  // Write backwards.
  char* next = (char*)dst;
  char* start = next;
  do {
    *next++ = '0' + (value % 10);
    value /= 10;
  } while (value != 0);
  unsigned length = next - start;

  // Reverse in-place.
  next--;
  while (next > start) {
    char swap = *next;
    *next = *start;
    *start = swap;
    next--;
    start++;
  }
  return length;
}

void u64ToAsciiClassicBM(unsigned int n, size_t index) {
  checkArrayIndex(uint64Num, index);
  char buf[20];
  FOR_EACH_RANGE (i, 0, n) {
    doNotOptimizeAway(u64ToAsciiClassic(uint64Num[index] + (i % 8), buf));
  }
}

void u64ToAsciiFollyBM(unsigned int n, size_t index) {
  checkArrayIndex(uint64Num, index);
  char buf[20];
  FOR_EACH_RANGE (i, 0, n) {
    doNotOptimizeAway(uint64ToBufferUnsafe(uint64Num[index] + (i % 8), buf));
  }
}

// Benchmark unsigned to string conversion

void u64ToStringClibMeasure(unsigned int n, size_t index) {
  // FOLLY_RANGE_CHECK_TO_STRING expands to std::to_string, except on Android
  // where std::to_string is not supported
  checkArrayIndex(uint64Num, index);
  FOR_EACH_RANGE (i, 0, n) {
    doNotOptimizeAway(
        FOLLY_RANGE_CHECK_TO_STRING(uint64Num[index] + (i % 8)).size());
  }
}

void u64ToStringFollyMeasure(unsigned int n, size_t index) {
  checkArrayIndex(uint64Num, index);
  FOR_EACH_RANGE (i, 0, n) {
    doNotOptimizeAway(to<std::string>(uint64Num[index] + (i % 8)).size());
  }
}

// Signed

void i64ToStringFollyMeasurePos(unsigned int n, size_t index) {
  checkArrayIndex(int64Pos, index);
  FOR_EACH_RANGE (i, 0, n) {
    doNotOptimizeAway(to<std::string>(int64Pos[index] + (i % 8)).size());
  }
}

void i64ToStringFollyMeasureNeg(unsigned int n, size_t index) {
  checkArrayIndex(int64Neg, index);
  FOR_EACH_RANGE (i, 0, n) {
    doNotOptimizeAway(to<std::string>(int64Neg[index] - (i % 8)).size());
  }
}

// Benchmark uitoa with string append

void u2aAppendClassicBM(unsigned int n, size_t index) {
  checkArrayIndex(uint64Num, index);
  string s;
  FOR_EACH_RANGE (i, 0, n) {
    // auto buf = &s.back() + 1;
    char buffer[20];
    s.append(buffer, u64ToAsciiClassic(uint64Num[index] + (i % 8), buffer));
    doNotOptimizeAway(s.size());
  }
}

void u2aAppendFollyBM(unsigned int n, size_t index) {
  checkArrayIndex(uint64Num, index);
  string s;
  FOR_EACH_RANGE (i, 0, n) {
    // auto buf = &s.back() + 1;
    char buffer[20];
    s.append(buffer, uint64ToBufferUnsafe(uint64Num[index] + (i % 8), buffer));
    doNotOptimizeAway(s.size());
  }
}

template <class String>
struct StringIdenticalToBM {
  StringIdenticalToBM() {}
  void operator()(unsigned int n, size_t len) const {
    String s;
    BENCHMARK_SUSPEND {
      s.append(len, '0');
    }
    FOR_EACH_RANGE (i, 0, n) {
      String result = to<String>(s);
      doNotOptimizeAway(result.size());
    }
  }
};

template <class String>
struct StringVariadicToBM {
  StringVariadicToBM() {}
  void operator()(unsigned int n, size_t len) const {
    String s;
    BENCHMARK_SUSPEND {
      s.append(len, '0');
    }
    FOR_EACH_RANGE (i, 0, n) {
      String result = to<String>(s, nullptr);
      doNotOptimizeAway(result.size());
    }
  }
};

namespace folly {
namespace conv_bench_detail {

// Keep this data global and non-const, so the compiler cannot make
// any assumptions about the actual values at compile time

size_t bigInt = 11424545345345;
size_t smallInt = 104;
char someString[] = "this is some nice string";
char otherString[] = "this is a long string, so it's not so nice";
char reallyShort[] = "meh";
std::string stdString = "std::strings are very nice";
float fValue = 1.2355f;
double dValue = 345345345.435;
} // namespace conv_bench_detail
} // namespace folly

BENCHMARK(preallocateTestNoFloat, n) {
  for (size_t i = 0; i < n; ++i) {
    doNotOptimizeAway(
        to<std::string>(bigInt, someString, stdString, otherString).size());
    doNotOptimizeAway(to<std::string>(reallyShort, smallInt).size());
    doNotOptimizeAway(to<std::string>(bigInt, stdString).size());
    doNotOptimizeAway(
        to<std::string>(bigInt, stdString, dValue, otherString).size());
    doNotOptimizeAway(to<std::string>(bigInt, someString, reallyShort).size());
  }
}

BENCHMARK(preallocateTestFloat, n) {
  for (size_t i = 0; i < n; ++i) {
    doNotOptimizeAway(to<std::string>(stdString, ',', fValue, dValue).size());
    doNotOptimizeAway(to<std::string>(stdString, ',', dValue).size());
  }
}

namespace folly {
namespace conv_bench_detail {

// Keep this data global and non-const, so the compiler cannot make
// any assumptions about the actual values at compile time

int8_t i8s[] = {
    -(static_cast<int8_t>(1) << 4),
    static_cast<int8_t>(1) << 5,
    -(static_cast<int8_t>(1) << 6),
};

uint8_t u8s[] = {
    static_cast<uint8_t>(1) << 4,
    static_cast<uint8_t>(1) << 5,
    static_cast<uint8_t>(1) << 7,
};

int16_t i16s[] = {
    -(static_cast<int16_t>(1) << 8),
    static_cast<int16_t>(1) << 12,
    -(static_cast<int16_t>(1) << 14),
};

uint16_t u16s[] = {
    static_cast<uint16_t>(1) << 8,
    static_cast<uint16_t>(1) << 12,
    static_cast<uint16_t>(1) << 15,
};

int32_t i32s[] = {
    -(static_cast<int32_t>(1) << 16),
    static_cast<int32_t>(1) << 25,
    -(static_cast<int32_t>(1) << 30),
};

uint32_t u32s[] = {
    static_cast<uint32_t>(1) << 16,
    static_cast<uint32_t>(1) << 25,
    static_cast<uint32_t>(1) << 31,
};

int64_t i64s[] = {
    -(static_cast<int64_t>(1) << 32),
    static_cast<int64_t>(1) << 50,
    -(static_cast<int64_t>(1) << 62),
};

uint64_t u64s[] = {
    static_cast<uint64_t>(1) << 32,
    static_cast<uint64_t>(1) << 50,
    static_cast<uint64_t>(1) << 63,
};
} // namespace conv_bench_detail
} // namespace folly

BENCHMARK(preallocateTestInt8, n) {
  for (size_t i = 0; i < n; ++i) {
    doNotOptimizeAway(to<std::string>(
                          i8s[0],
                          ',',
                          u8s[0],
                          ',',
                          i8s[1],
                          ',',
                          u8s[1],
                          ',',
                          i8s[2],
                          ',',
                          u8s[2])
                          .size());
  }
}

BENCHMARK(preallocateTestInt16, n) {
  for (size_t i = 0; i < n; ++i) {
    doNotOptimizeAway(to<std::string>(
                          i16s[0],
                          ',',
                          u16s[0],
                          ',',
                          i16s[1],
                          ',',
                          u16s[1],
                          ',',
                          i16s[2],
                          ',',
                          u16s[2])
                          .size());
  }
}

BENCHMARK(preallocateTestInt32, n) {
  for (size_t i = 0; i < n; ++i) {
    doNotOptimizeAway(to<std::string>(
                          i32s[0],
                          ',',
                          u32s[0],
                          ',',
                          i32s[1],
                          ',',
                          u32s[1],
                          ',',
                          i32s[2],
                          ',',
                          u32s[2])
                          .size());
  }
}

BENCHMARK(preallocateTestInt64, n) {
  for (size_t i = 0; i < n; ++i) {
    doNotOptimizeAway(to<std::string>(
                          i64s[0],
                          ',',
                          u64s[0],
                          ',',
                          i64s[1],
                          ',',
                          u64s[1],
                          ',',
                          i64s[2],
                          ',',
                          u64s[2])
                          .size());
  }
}

#if FOLLY_HAVE_INT128_T
namespace {

__int128 i128s[] = {
    -(static_cast<__int128>(1) << 2),
    static_cast<__int128>(1) << 100,
    -(static_cast<__int128>(1) << 126),
};

unsigned __int128 u128s[] = {
    static_cast<unsigned __int128>(1) << 2,
    static_cast<unsigned __int128>(1) << 100,
    static_cast<unsigned __int128>(1) << 127,
};
} // namespace

BENCHMARK(preallocateTestInt128, n) {
  for (size_t i = 0; i < n; ++i) {
    doNotOptimizeAway(to<std::string>(
                          i128s[0],
                          ',',
                          u128s[0],
                          ',',
                          i128s[1],
                          ',',
                          u128s[1],
                          ',',
                          i128s[2],
                          ',',
                          u128s[2])
                          .size());
  }
}

BENCHMARK(preallocateTestNoFloatWithInt128, n) {
  for (size_t i = 0; i < n; ++i) {
    doNotOptimizeAway(
        to<std::string>(bigInt, someString, stdString, otherString).size());
    doNotOptimizeAway(
        to<std::string>(reallyShort, u128s[0], smallInt, i128s[2]).size());
    doNotOptimizeAway(
        to<std::string>(bigInt, i128s[0], stdString, u128s[1]).size());
    doNotOptimizeAway(
        to<std::string>(bigInt, stdString, dValue, otherString).size());
    doNotOptimizeAway(
        to<std::string>(bigInt, u128s[2], someString, reallyShort).size());
  }
}
#endif

BENCHMARK_DRAW_LINE();

static const StringIdenticalToBM<std::string> stringIdenticalToBM;
static const StringVariadicToBM<std::string> stringVariadicToBM;
static const StringIdenticalToBM<fbstring> fbstringIdenticalToBM;
static const StringVariadicToBM<fbstring> fbstringVariadicToBM;

#define DEFINE_BENCHMARK_GROUP(n)                \
  BENCHMARK_PARAM(u64ToAsciiClassicBM, n)        \
  BENCHMARK_RELATIVE_PARAM(u64ToAsciiTableBM, n) \
  BENCHMARK_RELATIVE_PARAM(u64ToAsciiFollyBM, n) \
  BENCHMARK_DRAW_LINE()

DEFINE_BENCHMARK_GROUP(1);
DEFINE_BENCHMARK_GROUP(2);
DEFINE_BENCHMARK_GROUP(3);
DEFINE_BENCHMARK_GROUP(4);
DEFINE_BENCHMARK_GROUP(5);
DEFINE_BENCHMARK_GROUP(6);
DEFINE_BENCHMARK_GROUP(7);
DEFINE_BENCHMARK_GROUP(8);
DEFINE_BENCHMARK_GROUP(9);
DEFINE_BENCHMARK_GROUP(10);
DEFINE_BENCHMARK_GROUP(11);
DEFINE_BENCHMARK_GROUP(12);
DEFINE_BENCHMARK_GROUP(13);
DEFINE_BENCHMARK_GROUP(14);
DEFINE_BENCHMARK_GROUP(15);
DEFINE_BENCHMARK_GROUP(16);
DEFINE_BENCHMARK_GROUP(17);
DEFINE_BENCHMARK_GROUP(18);
DEFINE_BENCHMARK_GROUP(19);
DEFINE_BENCHMARK_GROUP(20);

#undef DEFINE_BENCHMARK_GROUP

#define DEFINE_BENCHMARK_GROUP(n)                         \
  BENCHMARK_PARAM(u64ToStringClibMeasure, n)              \
  BENCHMARK_RELATIVE_PARAM(u64ToStringFollyMeasure, n)    \
  BENCHMARK_RELATIVE_PARAM(i64ToStringFollyMeasurePos, n) \
  BENCHMARK_RELATIVE_PARAM(i64ToStringFollyMeasureNeg, n) \
  BENCHMARK_DRAW_LINE()

DEFINE_BENCHMARK_GROUP(1);
DEFINE_BENCHMARK_GROUP(2);
DEFINE_BENCHMARK_GROUP(3);
DEFINE_BENCHMARK_GROUP(4);
DEFINE_BENCHMARK_GROUP(5);
DEFINE_BENCHMARK_GROUP(6);
DEFINE_BENCHMARK_GROUP(7);
DEFINE_BENCHMARK_GROUP(8);
DEFINE_BENCHMARK_GROUP(9);
DEFINE_BENCHMARK_GROUP(10);
DEFINE_BENCHMARK_GROUP(11);
DEFINE_BENCHMARK_GROUP(12);
DEFINE_BENCHMARK_GROUP(13);
DEFINE_BENCHMARK_GROUP(14);
DEFINE_BENCHMARK_GROUP(15);
DEFINE_BENCHMARK_GROUP(16);
DEFINE_BENCHMARK_GROUP(17);
DEFINE_BENCHMARK_GROUP(18);
DEFINE_BENCHMARK_GROUP(19);

// Only for u64
BENCHMARK_PARAM(u64ToStringClibMeasure, 20)
BENCHMARK_RELATIVE_PARAM(u64ToStringFollyMeasure, 20)
BENCHMARK_DRAW_LINE();

#undef DEFINE_BENCHMARK_GROUP

#if FOLLY_HAVE_INT128_T

void u128ToStringFollyMeasure(unsigned int n, size_t index) {
  checkArrayIndex(uint128Num, index);
  FOR_EACH_RANGE (i, 0, n) {
    doNotOptimizeAway(to<std::string>(uint128Num[index] + (i % 8)).size());
  }
}

void i128ToStringFollyMeasurePos(unsigned int n, size_t index) {
  checkArrayIndex(int128Pos, index);
  FOR_EACH_RANGE (i, 0, n) {
    doNotOptimizeAway(to<std::string>(int128Pos[index] + (i % 8)).size());
  }
}

void i128ToStringFollyMeasureNeg(unsigned int n, size_t index) {
  checkArrayIndex(int128Neg, index);
  FOR_EACH_RANGE (i, 0, n) {
    doNotOptimizeAway(to<std::string>(int128Neg[index] + (i % 8)).size());
  }
}

#define DEFINE_BENCHMARK_GROUP(n)                          \
  BENCHMARK_PARAM(u128ToStringFollyMeasure, n)             \
  BENCHMARK_RELATIVE_PARAM(i128ToStringFollyMeasurePos, n) \
  BENCHMARK_RELATIVE_PARAM(i128ToStringFollyMeasureNeg, n) \
  BENCHMARK_DRAW_LINE()

DEFINE_BENCHMARK_GROUP(1);
DEFINE_BENCHMARK_GROUP(2);
DEFINE_BENCHMARK_GROUP(3);
DEFINE_BENCHMARK_GROUP(4);
DEFINE_BENCHMARK_GROUP(5);
DEFINE_BENCHMARK_GROUP(6);
DEFINE_BENCHMARK_GROUP(7);
DEFINE_BENCHMARK_GROUP(8);
DEFINE_BENCHMARK_GROUP(9);
DEFINE_BENCHMARK_GROUP(10);
DEFINE_BENCHMARK_GROUP(11);
DEFINE_BENCHMARK_GROUP(12);
DEFINE_BENCHMARK_GROUP(13);
DEFINE_BENCHMARK_GROUP(14);
DEFINE_BENCHMARK_GROUP(15);
DEFINE_BENCHMARK_GROUP(16);
DEFINE_BENCHMARK_GROUP(17);
DEFINE_BENCHMARK_GROUP(18);
DEFINE_BENCHMARK_GROUP(19);
DEFINE_BENCHMARK_GROUP(20);
DEFINE_BENCHMARK_GROUP(21);
DEFINE_BENCHMARK_GROUP(22);
DEFINE_BENCHMARK_GROUP(23);
DEFINE_BENCHMARK_GROUP(24);
DEFINE_BENCHMARK_GROUP(25);
DEFINE_BENCHMARK_GROUP(26);
DEFINE_BENCHMARK_GROUP(27);
DEFINE_BENCHMARK_GROUP(28);
DEFINE_BENCHMARK_GROUP(29);
DEFINE_BENCHMARK_GROUP(30);
DEFINE_BENCHMARK_GROUP(31);
DEFINE_BENCHMARK_GROUP(32);
DEFINE_BENCHMARK_GROUP(33);
DEFINE_BENCHMARK_GROUP(34);
DEFINE_BENCHMARK_GROUP(35);
DEFINE_BENCHMARK_GROUP(36);
DEFINE_BENCHMARK_GROUP(37);
DEFINE_BENCHMARK_GROUP(38);
DEFINE_BENCHMARK_GROUP(39);

BENCHMARK_DRAW_LINE();

#undef DEFINE_BENCHMARK_GROUP

#endif

#define DEFINE_BENCHMARK_GROUP(n)                     \
  BENCHMARK_PARAM(clibAtoiMeasure, n)                 \
  BENCHMARK_RELATIVE_PARAM(lexicalCastMeasure, n)     \
  BENCHMARK_RELATIVE_PARAM(handwrittenAtoiMeasure, n) \
  BENCHMARK_RELATIVE_PARAM(follyAtoiMeasure, n)       \
  BENCHMARK_DRAW_LINE()

DEFINE_BENCHMARK_GROUP(1);
DEFINE_BENCHMARK_GROUP(2);
DEFINE_BENCHMARK_GROUP(3);
DEFINE_BENCHMARK_GROUP(4);
DEFINE_BENCHMARK_GROUP(5);
DEFINE_BENCHMARK_GROUP(6);
DEFINE_BENCHMARK_GROUP(7);
DEFINE_BENCHMARK_GROUP(8);
DEFINE_BENCHMARK_GROUP(9);
DEFINE_BENCHMARK_GROUP(10);
DEFINE_BENCHMARK_GROUP(11);
DEFINE_BENCHMARK_GROUP(12);
DEFINE_BENCHMARK_GROUP(13);
DEFINE_BENCHMARK_GROUP(14);
DEFINE_BENCHMARK_GROUP(15);
DEFINE_BENCHMARK_GROUP(16);
DEFINE_BENCHMARK_GROUP(17);
DEFINE_BENCHMARK_GROUP(18);
DEFINE_BENCHMARK_GROUP(19);

#undef DEFINE_BENCHMARK_GROUP

#define DEFINE_BENCHMARK_GROUP(T, n)            \
  BENCHMARK_PARAM(T##VariadicToBM, n)           \
  BENCHMARK_RELATIVE_PARAM(T##IdenticalToBM, n) \
  BENCHMARK_DRAW_LINE()

DEFINE_BENCHMARK_GROUP(string, 32);
DEFINE_BENCHMARK_GROUP(string, 1024);
DEFINE_BENCHMARK_GROUP(string, 32768);
DEFINE_BENCHMARK_GROUP(fbstring, 32);
DEFINE_BENCHMARK_GROUP(fbstring, 1024);
DEFINE_BENCHMARK_GROUP(fbstring, 32768);

#undef DEFINE_BENCHMARK_GROUP

namespace {

template <typename T>
inline void stringToTypeClassic(const char* str, uint32_t n) {
  for (uint32_t i = 0; i < n; ++i) {
    try {
      auto val = to<T>(str);
      doNotOptimizeAway(val);
    } catch (const std::exception& e) {
      doNotOptimizeAway(e.what());
    }
    doNotOptimizeAway(i);
  }
}

template <typename T>
inline void stringToTypeOptional(const char* str, uint32_t n) {
  for (uint32_t i = 0; i < n; ++i) {
    auto val = tryTo<T>(str);
    if (val.hasValue()) {
      doNotOptimizeAway(val.value());
    }
  }
}

template <typename T>
inline void ptrPairToIntClassic(StringPiece sp, uint32_t n) {
  for (uint32_t i = 0; i < n; ++i) {
    try {
      auto val = to<T>(sp.begin(), sp.end());
      doNotOptimizeAway(val);
    } catch (const std::exception& e) {
      doNotOptimizeAway(e.what());
    }
    doNotOptimizeAway(i);
  }
}

template <typename T>
inline void ptrPairToIntOptional(StringPiece sp, uint32_t n) {
  for (uint32_t i = 0; i < n; ++i) {
    auto val = tryTo<T>(sp.begin(), sp.end());
    if (val.hasValue()) {
      doNotOptimizeAway(val.value());
    }
  }
}

constexpr uint32_t kArithNumIter = 10000;

template <typename T, typename U>
inline size_t arithToArithClassic(const U* in, uint32_t numItems) {
  for (uint32_t i = 0; i < kArithNumIter; ++i) {
    for (uint32_t j = 0; j < numItems; ++j) {
      try {
        auto val = to<T>(in[j]);
        doNotOptimizeAway(val);
      } catch (const std::exception& e) {
        doNotOptimizeAway(e.what());
      }
      doNotOptimizeAway(j);
    }
    doNotOptimizeAway(i);
  }

  return kArithNumIter * numItems;
}

template <typename T, typename U>
inline size_t arithToArithOptional(const U* in, uint32_t numItems) {
  for (uint32_t i = 0; i < kArithNumIter; ++i) {
    for (uint32_t j = 0; j < numItems; ++j) {
      auto val = tryTo<T>(*in);
      doNotOptimizeAway(val.hasValue());
      if (val.hasValue()) {
        auto v2 = val.value();
        doNotOptimizeAway(v2);
      }
      doNotOptimizeAway(j);
    }
    doNotOptimizeAway(i);
  }

  return kArithNumIter * numItems;
}

} // namespace

namespace folly {
namespace conv_bench_detail {

// Keep this data global and non-const, so the compiler cannot make
// any assumptions about the actual values at compile time

std::array<int, 4> int2ScharGood{{-128, 127, 0, -50}};
std::array<int, 4> int2ScharBad{{-129, 128, 255, 10000}};
std::array<int, 4> int2UcharGood{{0, 1, 254, 255}};
std::array<int, 4> int2UcharBad{{-128, -1000, 256, -1}};

std::array<long long, 4> ll2SintOrFloatGood{{-2, -1, 0, 1}};
std::array<long long, 4> ll2SintOrFloatBad{{
    std::numeric_limits<long long>::min() / 5,
    std::numeric_limits<long long>::min() / 2,
    std::numeric_limits<long long>::max() / 2,
    std::numeric_limits<long long>::max() / 5,
}};
std::array<long long, 4> ll2UintGood{{1, 2, 3, 4}};
std::array<long long, 4> ll2UintBad{{-1, -2, -3, -4}};

std::array<double, 4> double2FloatGood{{1.0, 1.25, 2.5, 1000.0}};
std::array<double, 4> double2FloatBad{{1e100, 1e101, 1e102, 1e103}};
std::array<double, 4> double2IntGood{{1.0, 10.0, 100.0, 1000.0}};
std::array<double, 4> double2IntBad{{1e100, 1.25, 2.5, 100.00001}};
} // namespace conv_bench_detail
} // namespace folly

#define STRING_TO_TYPE_BENCHMARK(type, name, pass, fail) \
  BENCHMARK(stringTo##name##Classic, n) {                \
    stringToTypeClassic<type>(pass, n);                  \
  }                                                      \
  BENCHMARK(stringTo##name##ClassicError, n) {           \
    stringToTypeClassic<type>(fail, n);                  \
  }                                                      \
  BENCHMARK(stringTo##name##Optional, n) {               \
    stringToTypeOptional<type>(pass, n);                 \
  }                                                      \
  BENCHMARK(stringTo##name##OptionalError, n) {          \
    stringToTypeOptional<type>(fail, n);                 \
  }

#define PTR_PAIR_TO_INT_BENCHMARK(type, name, pass, fail) \
  BENCHMARK(ptrPairTo##name##Classic, n) {                \
    ptrPairToIntClassic<type>(pass, n);                   \
  }                                                       \
  BENCHMARK(ptrPairTo##name##ClassicError, n) {           \
    ptrPairToIntClassic<type>(fail, n);                   \
  }                                                       \
  BENCHMARK(ptrPairTo##name##Optional, n) {               \
    ptrPairToIntOptional<type>(pass, n);                  \
  }                                                       \
  BENCHMARK(ptrPairTo##name##OptionalError, n) {          \
    ptrPairToIntOptional<type>(fail, n);                  \
  }

#define ARITH_TO_ARITH_BENCHMARK(type, name, pass, fail)         \
  BENCHMARK_MULTI(name##Classic) {                               \
    return arithToArithClassic<type>(pass.data(), pass.size());  \
  }                                                              \
  BENCHMARK_MULTI(name##ClassicError) {                          \
    return arithToArithClassic<type>(fail.data(), fail.size());  \
  }                                                              \
  BENCHMARK_MULTI(name##Optional) {                              \
    return arithToArithOptional<type>(pass.data(), pass.size()); \
  }                                                              \
  BENCHMARK_MULTI(name##OptionalError) {                         \
    return arithToArithOptional<type>(fail.data(), fail.size()); \
  }

#define INT_TO_ARITH_BENCHMARK(type, name, pass, fail) \
  ARITH_TO_ARITH_BENCHMARK(type, intTo##name, pass, fail)

#define FLOAT_TO_ARITH_BENCHMARK(type, name, pass, fail) \
  ARITH_TO_ARITH_BENCHMARK(type, floatTo##name, pass, fail)

STRING_TO_TYPE_BENCHMARK(bool, BoolNum, " 1 ", "2")
STRING_TO_TYPE_BENCHMARK(bool, BoolStr, "true", "xxxx")
BENCHMARK_DRAW_LINE();
STRING_TO_TYPE_BENCHMARK(float, FloatNum, " 3.14 ", "3e5000x")
STRING_TO_TYPE_BENCHMARK(float, FloatStr, "-infinity", "xxxx")
STRING_TO_TYPE_BENCHMARK(double, DoubleNum, " 3.14 ", "3e5000x")
STRING_TO_TYPE_BENCHMARK(double, DoubleStr, "-infinity", "xxxx")
BENCHMARK_DRAW_LINE();
STRING_TO_TYPE_BENCHMARK(signed char, CharSigned, " -47 ", "1000")
STRING_TO_TYPE_BENCHMARK(unsigned char, CharUnsigned, " 47 ", "-47")
STRING_TO_TYPE_BENCHMARK(int, IntSigned, " -4711 ", "-10000000000000000000000")
STRING_TO_TYPE_BENCHMARK(unsigned int, IntUnsigned, " 4711 ", "-4711")
STRING_TO_TYPE_BENCHMARK(
    long long,
    LongLongSigned,
    " -8123456789123456789 ",
    "-10000000000000000000000")
STRING_TO_TYPE_BENCHMARK(
    unsigned long long,
    LongLongUnsigned,
    " 18123456789123456789 ",
    "-4711")
BENCHMARK_DRAW_LINE();

PTR_PAIR_TO_INT_BENCHMARK(signed char, CharSigned, "-47", "1000")
PTR_PAIR_TO_INT_BENCHMARK(unsigned char, CharUnsigned, "47", "1000")
PTR_PAIR_TO_INT_BENCHMARK(int, IntSigned, "-4711", "-10000000000000000000000")
PTR_PAIR_TO_INT_BENCHMARK(
    unsigned int,
    IntUnsigned,
    "4711",
    "10000000000000000000000")
PTR_PAIR_TO_INT_BENCHMARK(
    long long,
    LongLongSigned,
    "-8123456789123456789",
    "-10000000000000000000000")
PTR_PAIR_TO_INT_BENCHMARK(
    unsigned long long,
    LongLongUnsigned,
    "18123456789123456789",
    "20000000000000000000")
BENCHMARK_DRAW_LINE();

INT_TO_ARITH_BENCHMARK(signed char, CharSigned, int2ScharGood, int2ScharBad)
INT_TO_ARITH_BENCHMARK(unsigned char, CharUnsigned, int2UcharGood, int2UcharBad)
INT_TO_ARITH_BENCHMARK(int, IntSigned, ll2SintOrFloatGood, ll2SintOrFloatBad)
INT_TO_ARITH_BENCHMARK(unsigned int, IntUnsigned, ll2UintGood, ll2UintBad)
BENCHMARK_DRAW_LINE();
INT_TO_ARITH_BENCHMARK(float, Float, ll2SintOrFloatGood, ll2SintOrFloatBad)
BENCHMARK_DRAW_LINE();
FLOAT_TO_ARITH_BENCHMARK(float, Float, double2FloatGood, double2FloatBad)
BENCHMARK_DRAW_LINE();
FLOAT_TO_ARITH_BENCHMARK(int, Int, double2IntGood, double2IntBad)

#undef STRING_TO_TYPE_BENCHMARK
#undef PTR_PAIR_TO_INT_BENCHMARK
#undef ARITH_TO_ARITH_BENCHMARK
#undef INT_TO_ARITH_BENCHMARK
#undef FLOAT_TO_ARITH_BENCHMARK

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
  return 0;
}
