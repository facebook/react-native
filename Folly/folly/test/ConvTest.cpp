/*
 * Copyright 2011-present Facebook, Inc.
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

#ifndef __STDC_FORMAT_MACROS
#define __STDC_FORMAT_MACROS 1
#endif

#include <boost/lexical_cast.hpp>

#include <folly/Conv.h>
#include <folly/container/Foreach.h>
#include <folly/portability/GTest.h>

#include <algorithm>
#include <cinttypes>
#include <limits>
#include <sstream>
#include <stdexcept>
#include <tuple>

using namespace std;
using namespace folly;

TEST(Conv, digits10) {
  char buffer[100];
  uint64_t power;

  // first, some basic sniff tests
  EXPECT_EQ(1, digits10(0));
  EXPECT_EQ(1, digits10(1));
  EXPECT_EQ(1, digits10(9));
  EXPECT_EQ(2, digits10(10));
  EXPECT_EQ(2, digits10(99));
  EXPECT_EQ(3, digits10(100));
  EXPECT_EQ(3, digits10(999));
  EXPECT_EQ(4, digits10(1000));
  EXPECT_EQ(4, digits10(9999));
  EXPECT_EQ(20, digits10(18446744073709551615ULL));

  // try the first X nonnegatives.
  // Covers some more cases of 2^p, 10^p
  for (uint64_t i = 0; i < 100000; i++) {
    snprintf(buffer, sizeof(buffer), "%" PRIu64, i);
    EXPECT_EQ(strlen(buffer), digits10(i));
  }

  // try powers of 2
  power = 1;
  for (int p = 0; p < 64; p++) {
    snprintf(buffer, sizeof(buffer), "%" PRIu64, power);
    EXPECT_EQ(strlen(buffer), digits10(power));
    snprintf(buffer, sizeof(buffer), "%" PRIu64, power - 1);
    EXPECT_EQ(strlen(buffer), digits10(power - 1));
    snprintf(buffer, sizeof(buffer), "%" PRIu64, power + 1);
    EXPECT_EQ(strlen(buffer), digits10(power + 1));
    power *= 2;
  }

  // try powers of 10
  power = 1;
  for (int p = 0; p < 20; p++) {
    snprintf(buffer, sizeof(buffer), "%" PRIu64, power);
    EXPECT_EQ(strlen(buffer), digits10(power));
    snprintf(buffer, sizeof(buffer), "%" PRIu64, power - 1);
    EXPECT_EQ(strlen(buffer), digits10(power - 1));
    snprintf(buffer, sizeof(buffer), "%" PRIu64, power + 1);
    EXPECT_EQ(strlen(buffer), digits10(power + 1));
    power *= 10;
  }
}

// Test to<T>(T)
TEST(Conv, Type2Type) {
  bool boolV = true;
  EXPECT_EQ(to<bool>(boolV), true);

  int intV = 42;
  EXPECT_EQ(to<int>(intV), 42);

  float floatV = 4.2f;
  EXPECT_EQ(to<float>(floatV), 4.2f);

  double doubleV = 0.42;
  EXPECT_EQ(to<double>(doubleV), 0.42);

  std::string stringV = "StdString";
  EXPECT_EQ(to<std::string>(stringV), "StdString");

  folly::fbstring fbStrV = "FBString";
  EXPECT_EQ(to<folly::fbstring>(fbStrV), "FBString");

  folly::StringPiece spV("StringPiece");
  EXPECT_EQ(to<folly::StringPiece>(spV), "StringPiece");

  // Rvalues
  EXPECT_EQ(to<bool>(true), true);
  EXPECT_EQ(to<int>(42), 42);
  EXPECT_EQ(to<float>(4.2f), 4.2f);
  EXPECT_EQ(to<double>(.42), .42);
  EXPECT_EQ(to<std::string>(std::string("Hello")), "Hello");
  EXPECT_EQ(to<folly::fbstring>(folly::fbstring("hello")), "hello");
  EXPECT_EQ(
      to<folly::StringPiece>(folly::StringPiece("Forty Two")), "Forty Two");
}

TEST(Conv, Integral2Integral) {
  // Same size, different signs
  int64_t s64 = numeric_limits<uint8_t>::max();
  EXPECT_EQ(to<uint8_t>(s64), s64);

  s64 = numeric_limits<int8_t>::max();
  EXPECT_EQ(to<int8_t>(s64), s64);
}

TEST(Conv, Floating2Floating) {
  float f1 = 1e3f;
  double d1 = to<double>(f1);
  EXPECT_EQ(f1, d1);

  double d2 = 23.0;
  auto f2 = to<float>(d2);
  EXPECT_EQ(double(f2), d2);

  double invalidFloat = std::numeric_limits<double>::max();
  EXPECT_ANY_THROW(to<float>(invalidFloat));
  invalidFloat = -std::numeric_limits<double>::max();
  EXPECT_ANY_THROW(to<float>(invalidFloat));

  try {
    auto shouldWork = to<float>(std::numeric_limits<double>::min());
    // The value of `shouldWork' is an implementation defined choice
    // between the following two alternatives.
    EXPECT_TRUE(
        shouldWork == std::numeric_limits<float>::min() || shouldWork == 0.f);
  } catch (...) {
    ADD_FAILURE();
  }
}

template <class String>
void testIntegral2String() {}

template <class String, class Int, class... Ints>
void testIntegral2String() {
  typedef typename make_unsigned<Int>::type Uint;
  typedef typename make_signed<Int>::type Sint;

  Uint value = 123;
  EXPECT_EQ(to<String>(value), "123");
  Sint svalue = 123;
  EXPECT_EQ(to<String>(svalue), "123");
  svalue = -123;
  EXPECT_EQ(to<String>(svalue), "-123");

  value = numeric_limits<Uint>::min();
  EXPECT_EQ(to<Uint>(to<String>(value)), value);
  value = numeric_limits<Uint>::max();
  EXPECT_EQ(to<Uint>(to<String>(value)), value);

  svalue = numeric_limits<Sint>::min();
  EXPECT_EQ(to<Sint>(to<String>(svalue)), svalue);
  value = numeric_limits<Sint>::max();
  EXPECT_EQ(to<Sint>(to<String>(svalue)), svalue);

  testIntegral2String<String, Ints...>();
}

#if FOLLY_HAVE_INT128_T
template <class String>
void test128Bit2String() {
  typedef unsigned __int128 Uint;
  typedef __int128 Sint;

  EXPECT_EQ(detail::digitsEnough<unsigned __int128>(), 39);

  Uint value = 123;
  EXPECT_EQ(to<String>(value), "123");
  Sint svalue = 123;
  EXPECT_EQ(to<String>(svalue), "123");
  svalue = -123;
  EXPECT_EQ(to<String>(svalue), "-123");

  value = __int128(1) << 64;
  EXPECT_EQ(to<String>(value), "18446744073709551616");

  svalue = -(__int128(1) << 64);
  EXPECT_EQ(to<String>(svalue), "-18446744073709551616");

  value = 0;
  EXPECT_EQ(to<String>(value), "0");

  svalue = 0;
  EXPECT_EQ(to<String>(svalue), "0");

  value = ~__int128(0);
  EXPECT_EQ(to<String>(value), "340282366920938463463374607431768211455");

  svalue = -(Uint(1) << 127);
  EXPECT_EQ(to<String>(svalue), "-170141183460469231731687303715884105728");

  svalue = (Uint(1) << 127) - 1;
  EXPECT_EQ(to<String>(svalue), "170141183460469231731687303715884105727");

  // TODO: the following do not compile to<__int128> ...

#if 0
  value = numeric_limits<Uint>::min();
  EXPECT_EQ(to<Uint>(to<String>(value)), value);
  value = numeric_limits<Uint>::max();
  EXPECT_EQ(to<Uint>(to<String>(value)), value);

  svalue = numeric_limits<Sint>::min();
  EXPECT_EQ(to<Sint>(to<String>(svalue)), svalue);
  value = numeric_limits<Sint>::max();
  EXPECT_EQ(to<Sint>(to<String>(svalue)), svalue);
#endif
}

#endif

TEST(Conv, Integral2String) {
  testIntegral2String<std::string, int8_t, int16_t, int32_t, int64_t>();
  testIntegral2String<fbstring, int8_t, int16_t, int32_t, int64_t>();

#if FOLLY_HAVE_INT128_T
  test128Bit2String<std::string>();
  test128Bit2String<fbstring>();
#endif
}

template <class String>
void testString2Integral() {}

template <class String, class Int, class... Ints>
void testString2Integral() {
  typedef typename make_unsigned<Int>::type Uint;
  typedef typename make_signed<Int>::type Sint;

  // Unsigned numbers small enough to fit in a signed type
  static const String strings[] = {
      "0",
      "00",
      "2 ",
      " 84",
      " \n 123    \t\n",
      " 127",
      "0000000000000000000000000042",
  };
  static const Uint values[] = {
      0,
      0,
      2,
      84,
      123,
      127,
      42,
  };
  FOR_EACH_RANGE (i, 0, sizeof(strings) / sizeof(*strings)) {
    EXPECT_EQ(to<Uint>(strings[i]), values[i]);
    EXPECT_EQ(to<Sint>(strings[i]), values[i]);
  }

  // Unsigned numbers that won't fit in the signed variation
  static const String uStrings[] = {
      " 128",
      "213",
      "255",
  };
  static const Uint uValues[] = {
      128,
      213,
      255,
  };
  FOR_EACH_RANGE (i, 0, sizeof(uStrings) / sizeof(*uStrings)) {
    EXPECT_EQ(to<Uint>(uStrings[i]), uValues[i]);
    if (sizeof(Int) == 1) {
      EXPECT_THROW(to<Sint>(uStrings[i]), std::range_error);
    }
  }

  if (sizeof(Int) >= 4) {
    static const String strings2[] = {
        "256",
        "6324 ",
        "63245675 ",
        "2147483647",
    };
    static const Uint values2[] = {
        (Uint)256,
        (Uint)6324,
        (Uint)63245675,
        (Uint)2147483647,
    };
    FOR_EACH_RANGE (i, 0, sizeof(strings2) / sizeof(*strings2)) {
      EXPECT_EQ(to<Uint>(strings2[i]), values2[i]);
      EXPECT_EQ(to<Sint>(strings2[i]), values2[i]);
    }

    static const String uStrings2[] = {
        "2147483648",
        "3147483648",
        "4147483648",
        "4000000000",
    };
    static const Uint uValues2[] = {
        (Uint)2147483648U,
        (Uint)3147483648U,
        (Uint)4147483648U,
        (Uint)4000000000U,
    };
    FOR_EACH_RANGE (i, 0, sizeof(uStrings2) / sizeof(uStrings2)) {
      EXPECT_EQ(to<Uint>(uStrings2[i]), uValues2[i]);
      if (sizeof(Int) == 4) {
        EXPECT_THROW(to<Sint>(uStrings2[i]), std::range_error);
      }
    }
  }

  if (sizeof(Int) >= 8) {
    static_assert(sizeof(Int) <= 8, "Now that would be interesting");
    static const String strings3[] = {
        "2147483648",
        "5000000001",
        "25687346509278435",
        "100000000000000000",
        "9223372036854775807",
    };
    static const Uint values3[] = {
        (Uint)2147483648ULL,
        (Uint)5000000001ULL,
        (Uint)25687346509278435ULL,
        (Uint)100000000000000000ULL,
        (Uint)9223372036854775807ULL,
    };
    FOR_EACH_RANGE (i, 0, sizeof(strings3) / sizeof(*strings3)) {
      EXPECT_EQ(to<Uint>(strings3[i]), values3[i]);
      EXPECT_EQ(to<Sint>(strings3[i]), values3[i]);
    }

    static const String uStrings3[] = {
        "9223372036854775808",
        "9987435987394857987",
        "17873648761234698740",
        "18446744073709551615",
    };
    static const Uint uValues3[] = {
        (Uint)9223372036854775808ULL,
        (Uint)9987435987394857987ULL,
        (Uint)17873648761234698740ULL,
        (Uint)18446744073709551615ULL,
    };
    FOR_EACH_RANGE (i, 0, sizeof(uStrings3) / sizeof(*uStrings3)) {
      EXPECT_EQ(to<Uint>(uStrings3[i]), uValues3[i]);
      if (sizeof(Int) == 8) {
        EXPECT_THROW(to<Sint>(uStrings3[i]), std::range_error);
      }
    }
  }

  // Minimum possible negative values, and negative sign overflow
  static const String strings4[] = {
      "-128",
      "-32768",
      "-2147483648",
      "-9223372036854775808",
  };
  static const String strings5[] = {
      "-129",
      "-32769",
      "-2147483649",
      "-9223372036854775809",
  };
  static const Sint values4[] = {
      (Sint)-128LL,
      (Sint)-32768LL,
      (Sint)-2147483648LL,
      (Sint)(-9223372036854775807LL - 1),
  };
  FOR_EACH_RANGE (i, 0, sizeof(strings4) / sizeof(*strings4)) {
    if (sizeof(Int) > std::pow(2, i)) {
      EXPECT_EQ(values4[i], to<Sint>(strings4[i]));
      EXPECT_EQ(values4[i] - 1, to<Sint>(strings5[i]));
    } else if (sizeof(Int) == std::pow(2, i)) {
      EXPECT_EQ(values4[i], to<Sint>(strings4[i]));
      EXPECT_THROW(to<Sint>(strings5[i]), std::range_error);
    } else {
      EXPECT_THROW(to<Sint>(strings4[i]), std::range_error);
      EXPECT_THROW(to<Sint>(strings5[i]), std::range_error);
    }
  }

  // Bogus string values
  static const String bogusStrings[] = {
      "",
      "0x1234",
      "123L",
      "123a",
      "x 123 ",
      "234 y",
      "- 42", // whitespace is not allowed between the sign and the value
      " +   13 ",
      "12345678901234567890123456789",
  };
  for (const auto& str : bogusStrings) {
    EXPECT_THROW(to<Sint>(str), std::range_error);
    EXPECT_THROW(to<Uint>(str), std::range_error);
  }

  // A leading '+' character is only allowed when converting to signed types.
  String posSign("+42");
  EXPECT_EQ(42, to<Sint>(posSign));
  EXPECT_THROW(to<Uint>(posSign), std::range_error);

  testString2Integral<String, Ints...>();
}

TEST(Conv, String2Integral) {
  testString2Integral<const char*, int8_t, int16_t, int32_t, int64_t>();
  testString2Integral<std::string, int8_t, int16_t, int32_t, int64_t>();
  testString2Integral<fbstring, int8_t, int16_t, int32_t, int64_t>();

  // Testing the behavior of the StringPiece* API
  // StringPiece* normally parses as much valid data as it can,
  // and advances the StringPiece to the end of the valid data.
  char buf1[] = "100foo";
  StringPiece sp1(buf1);
  EXPECT_EQ(100, to<uint8_t>(&sp1));
  EXPECT_EQ(buf1 + 3, sp1.begin());
  // However, if the next character would cause an overflow it throws a
  // range_error rather than consuming only as much as it can without
  // overflowing.
  char buf2[] = "1002";
  StringPiece sp2(buf2);
  EXPECT_THROW(to<uint8_t>(&sp2), std::range_error);
  EXPECT_EQ(buf2, sp2.begin());
}

TEST(Conv, StringPiece2Integral) {
  string s = "  +123  hello world  ";
  StringPiece sp = s;
  EXPECT_EQ(to<int>(&sp), 123);
  EXPECT_EQ(sp, "  hello world  ");
}

TEST(Conv, StringPieceAppend) {
  string s = "foobar";
  {
    StringPiece sp(s, 0, 3);
    string result = to<string>(s, sp);
    EXPECT_EQ(result, "foobarfoo");
  }
  {
    StringPiece sp1(s, 0, 3);
    StringPiece sp2(s, 3, 3);
    string result = to<string>(sp1, sp2);
    EXPECT_EQ(result, s);
  }
}

TEST(Conv, BadStringToIntegral) {
  // Note that leading spaces (e.g.  " 1") are valid.
  vector<string> v = {"a", "", " ", "\n", " a0", "abcdef", "1Z", "!#"};
  for (auto& s : v) {
    EXPECT_THROW(to<int>(s), std::range_error) << "s=" << s;
  }
}

template <class String>
void testIdenticalTo() {
  String s("Yukkuri shiteitte ne!!!");

  String result = to<String>(s);
  EXPECT_EQ(result, s);
}

template <class String>
void testVariadicTo() {
  String s;
  toAppend(&s);
  toAppend("Lorem ipsum ", 1234, String(" dolor amet "), 567.89, '!', &s);
  EXPECT_EQ(s, "Lorem ipsum 1234 dolor amet 567.89!");

  s = to<String>();
  EXPECT_TRUE(s.empty());

  s = to<String>("Lorem ipsum ", nullptr, 1234, " dolor amet ", 567.89, '.');
  EXPECT_EQ(s, "Lorem ipsum 1234 dolor amet 567.89.");
}

template <class String>
void testIdenticalToDelim() {
  String s("Yukkuri shiteitte ne!!!");

  String charDelim = toDelim<String>('$', s);
  EXPECT_EQ(charDelim, s);

  String strDelim = toDelim<String>(String(">_<"), s);
  EXPECT_EQ(strDelim, s);
}

template <class String>
void testVariadicToDelim() {
  String s;
  toAppendDelim(":", &s);
  toAppendDelim(
      ":", "Lorem ipsum ", 1234, String(" dolor amet "), 567.89, '!', &s);
  EXPECT_EQ(s, "Lorem ipsum :1234: dolor amet :567.89:!");

  s = toDelim<String>(':');
  EXPECT_TRUE(s.empty());

  s = toDelim<String>(
      ":", "Lorem ipsum ", nullptr, 1234, " dolor amet ", 567.89, '.');
  EXPECT_EQ(s, "Lorem ipsum ::1234: dolor amet :567.89:.");
}

TEST(Conv, NullString) {
  string s1 = to<string>((char*)nullptr);
  EXPECT_TRUE(s1.empty());
  fbstring s2 = to<fbstring>((char*)nullptr);
  EXPECT_TRUE(s2.empty());
}

TEST(Conv, VariadicTo) {
  testIdenticalTo<string>();
  testIdenticalTo<fbstring>();
  testVariadicTo<string>();
  testVariadicTo<fbstring>();
}

TEST(Conv, VariadicToDelim) {
  testIdenticalToDelim<string>();
  testIdenticalToDelim<fbstring>();
  testVariadicToDelim<string>();
  testVariadicToDelim<fbstring>();
}

template <class String>
void testDoubleToString() {
  EXPECT_EQ(to<string>(0.0), "0");
  EXPECT_EQ(to<string>(0.5), "0.5");
  EXPECT_EQ(to<string>(10.25), "10.25");
  EXPECT_EQ(to<string>(1.123e10), "11230000000");
}

TEST(Conv, DoubleToString) {
  testDoubleToString<string>();
  testDoubleToString<fbstring>();
}

TEST(Conv, FBStringToString) {
  fbstring foo("foo");
  string ret = to<string>(foo);
  EXPECT_EQ(ret, "foo");
  string ret2 = to<string>(foo, 2);
  EXPECT_EQ(ret2, "foo2");
}

TEST(Conv, StringPieceToDouble) {
  vector<tuple<const char*, const char*, double>> strs{
      make_tuple("2134123.125 zorro", " zorro", 2134123.125),
      make_tuple("  2134123.125 zorro", " zorro", 2134123.125),
      make_tuple(" 2134123.125  zorro", "  zorro", 2134123.125),
      make_tuple(" 2134123.125  zorro ", "  zorro ", 2134123.125),
      make_tuple("2134123.125zorro", "zorro", 2134123.125),
      make_tuple("0 zorro", " zorro", 0.0),
      make_tuple("  0 zorro", " zorro", 0.0),
      make_tuple(" 0  zorro", "  zorro", 0.0),
      make_tuple(" 0  zorro ", "  zorro ", 0.0),
      make_tuple("0zorro", "zorro", 0.0),
      make_tuple("0.0 zorro", " zorro", 0.0),
      make_tuple("  0.0 zorro", " zorro", 0.0),
      make_tuple(" 0.0  zorro", "  zorro", 0.0),
      make_tuple(" 0.0  zorro ", "  zorro ", 0.0),
      make_tuple("0.0zorro", "zorro", 0.0),
      make_tuple("0.0eb", "eb", 0.0),
      make_tuple("0.0EB", "EB", 0.0),
      make_tuple("0eb", "eb", 0.0),
      make_tuple("0EB", "EB", 0.0),
      make_tuple("12e", "e", 12.0),
      make_tuple("12e-", "e-", 12.0),
      make_tuple("12e+", "e+", 12.0),
      make_tuple("12e-f-g", "e-f-g", 12.0),
      make_tuple("12e+f+g", "e+f+g", 12.0),
      make_tuple("12euro", "euro", 12.0),
  };
  for (const auto& s : strs) {
    StringPiece pc(get<0>(s));
    EXPECT_EQ(get<2>(s), to<double>(&pc)) << "\"" << get<0>(s) << "\"";
    EXPECT_EQ(get<1>(s), pc);
    EXPECT_THROW(to<double>(StringPiece(get<0>(s))), std::range_error);
    EXPECT_EQ(get<2>(s), to<double>(StringPiece(get<0>(s), pc.data())));
  }

  // Test NaN conversion
  try {
    to<double>("not a number");
    ADD_FAILURE();
  } catch (const std::range_error&) {
  }

  EXPECT_TRUE(std::isnan(to<double>("nan")));
  EXPECT_TRUE(std::isnan(to<double>("NaN")));
  EXPECT_TRUE(std::isnan(to<double>("NAN")));
  EXPECT_TRUE(std::isnan(to<double>("-nan")));
  EXPECT_TRUE(std::isnan(to<double>("-NaN")));
  EXPECT_TRUE(std::isnan(to<double>("-NAN")));

  EXPECT_EQ(to<double>("inf"), numeric_limits<double>::infinity());
  EXPECT_EQ(to<double>("Inf"), numeric_limits<double>::infinity());
  EXPECT_EQ(to<double>("INF"), numeric_limits<double>::infinity());
  EXPECT_EQ(to<double>("inF"), numeric_limits<double>::infinity());
  EXPECT_EQ(to<double>("infinity"), numeric_limits<double>::infinity());
  EXPECT_EQ(to<double>("Infinity"), numeric_limits<double>::infinity());
  EXPECT_EQ(to<double>("INFINITY"), numeric_limits<double>::infinity());
  EXPECT_EQ(to<double>("iNfInItY"), numeric_limits<double>::infinity());
  EXPECT_THROW(to<double>("infinitX"), std::range_error);
  EXPECT_EQ(to<double>("-inf"), -numeric_limits<double>::infinity());
  EXPECT_EQ(to<double>("-Inf"), -numeric_limits<double>::infinity());
  EXPECT_EQ(to<double>("-INF"), -numeric_limits<double>::infinity());
  EXPECT_EQ(to<double>("-inF"), -numeric_limits<double>::infinity());
  EXPECT_EQ(to<double>("-infinity"), -numeric_limits<double>::infinity());
  EXPECT_EQ(to<double>("-Infinity"), -numeric_limits<double>::infinity());
  EXPECT_EQ(to<double>("-INFINITY"), -numeric_limits<double>::infinity());
  EXPECT_EQ(to<double>("-iNfInItY"), -numeric_limits<double>::infinity());
  EXPECT_THROW(to<double>("-infinitX"), std::range_error);
}

TEST(Conv, EmptyStringToInt) {
  string s = "";
  StringPiece pc(s);

  try {
    to<int>(pc);
    ADD_FAILURE();
  } catch (const std::range_error&) {
  }
}

TEST(Conv, CorruptedStringToInt) {
  string s = "-1";
  StringPiece pc(s.data(), s.data() + 1); // Only  "-"

  try {
    to<int64_t>(&pc);
    ADD_FAILURE();
  } catch (const std::range_error&) {
  }
}

TEST(Conv, EmptyStringToDouble) {
  string s = "";
  StringPiece pc(s);

  try {
    to<double>(pc);
    ADD_FAILURE();
  } catch (const std::range_error&) {
  }
}

TEST(Conv, IntToDouble) {
  auto d = to<double>(42);
  EXPECT_EQ(d, 42);
  /* This seems not work in ubuntu11.10, gcc 4.6.1
  try {
    auto f = to<float>(957837589847);
    ADD_FAILURE();
  } catch (std::range_error& e) {
    //LOG(INFO) << e.what();
  }
  */
}

TEST(Conv, DoubleToInt) {
  auto i = to<int>(42.0);
  EXPECT_EQ(i, 42);
  try {
    auto i2 = to<int>(42.1);
    LOG(ERROR) << "to<int> returned " << i2 << " instead of throwing";
    ADD_FAILURE();
  } catch (std::range_error&) {
    // LOG(INFO) << e.what();
  }
}

TEST(Conv, EnumToInt) {
  enum A { x = 42, y = 420, z = 65 };
  auto i = to<int>(x);
  EXPECT_EQ(i, 42);
  auto j = to<char>(x);
  EXPECT_EQ(j, 42);
  try {
    auto i2 = to<char>(y);
    LOG(ERROR) << "to<char> returned " << static_cast<unsigned int>(i2)
               << " instead of throwing";
    ADD_FAILURE();
  } catch (std::range_error&) {
    // LOG(INFO) << e.what();
  }
}

TEST(Conv, EnumToString) {
  // task 813959
  enum A { x = 4, y = 420, z = 65 };
  EXPECT_EQ("foo.4", to<string>("foo.", x));
  EXPECT_EQ("foo.420", to<string>("foo.", y));
  EXPECT_EQ("foo.65", to<string>("foo.", z));
}

TEST(Conv, IntToEnum) {
  enum A { x = 42, y = 420 };
  auto i = to<A>(42);
  EXPECT_EQ(i, x);
  auto j = to<A>(100);
  EXPECT_EQ(j, 100);
  try {
    auto i2 = to<A>(5000000000L);
    LOG(ERROR) << "to<A> returned " << static_cast<unsigned int>(i2)
               << " instead of throwing";
    ADD_FAILURE();
  } catch (std::range_error&) {
    // LOG(INFO) << e.what();
  }
}

TEST(Conv, UnsignedEnum) {
  enum E : uint32_t { x = 3000000000U };
  auto u = to<uint32_t>(x);
  EXPECT_EQ(u, 3000000000U);
  auto s = to<string>(x);
  EXPECT_EQ("3000000000", s);
  auto e = to<E>(3000000000U);
  EXPECT_EQ(e, x);
  try {
    auto i = to<int32_t>(x);
    LOG(ERROR) << "to<int32_t> returned " << i << " instead of throwing";
    ADD_FAILURE();
  } catch (std::range_error&) {
  }
}

TEST(Conv, UnsignedEnumClass) {
  enum class E : uint32_t { x = 3000000000U };
  auto u = to<uint32_t>(E::x);
  EXPECT_GT(u, 0);
  EXPECT_EQ(u, 3000000000U);
  EXPECT_EQ("3000000000", to<string>(E::x));
  EXPECT_EQ(E::x, to<E>(3000000000U));
  EXPECT_EQ(E::x, to<E>("3000000000"));
  E e;
  EXPECT_TRUE(parseTo("3000000000", e).hasValue());
  EXPECT_EQ(E::x, e);
  EXPECT_THROW(to<int32_t>(E::x), std::range_error);
}

// Multi-argument to<string> uses toAppend, a different code path than
// to<string>(enum).
TEST(Conv, EnumClassToString) {
  enum class A { x = 4, y = 420, z = 65 };
  EXPECT_EQ("foo.4", to<string>("foo.", A::x));
  EXPECT_EQ("foo.420", to<string>("foo.", A::y));
  EXPECT_EQ("foo.65", to<string>("foo.", A::z));
}

TEST(Conv, IntegralToBool) {
  EXPECT_FALSE(to<bool>(0));
  EXPECT_FALSE(to<bool>(0ul));

  EXPECT_TRUE(to<bool>(1));
  EXPECT_TRUE(to<bool>(1ul));

  EXPECT_TRUE(to<bool>(-42));
  EXPECT_TRUE(to<bool>(42ul));
}

template <typename Src>
void testStr2Bool() {
  EXPECT_FALSE(to<bool>(Src("0")));
  EXPECT_FALSE(to<bool>(Src("  000  ")));

  EXPECT_FALSE(to<bool>(Src("n")));
  EXPECT_FALSE(to<bool>(Src("no")));
  EXPECT_FALSE(to<bool>(Src("false")));
  EXPECT_FALSE(to<bool>(Src("False")));
  EXPECT_FALSE(to<bool>(Src("  fAlSe  ")));
  EXPECT_FALSE(to<bool>(Src("F")));
  EXPECT_FALSE(to<bool>(Src("off")));

  EXPECT_TRUE(to<bool>(Src("1")));
  EXPECT_TRUE(to<bool>(Src("  001 ")));
  EXPECT_TRUE(to<bool>(Src("y")));
  EXPECT_TRUE(to<bool>(Src("yes")));
  EXPECT_TRUE(to<bool>(Src("\nyEs\t")));
  EXPECT_TRUE(to<bool>(Src("true")));
  EXPECT_TRUE(to<bool>(Src("True")));
  EXPECT_TRUE(to<bool>(Src("T")));
  EXPECT_TRUE(to<bool>(Src("on")));

  EXPECT_THROW(to<bool>(Src("")), std::range_error);
  EXPECT_THROW(to<bool>(Src("2")), std::range_error);
  EXPECT_THROW(to<bool>(Src("11")), std::range_error);
  EXPECT_THROW(to<bool>(Src("19")), std::range_error);
  EXPECT_THROW(to<bool>(Src("o")), std::range_error);
  EXPECT_THROW(to<bool>(Src("fal")), std::range_error);
  EXPECT_THROW(to<bool>(Src("tru")), std::range_error);
  EXPECT_THROW(to<bool>(Src("ye")), std::range_error);
  EXPECT_THROW(to<bool>(Src("yes foo")), std::range_error);
  EXPECT_THROW(to<bool>(Src("bar no")), std::range_error);
  EXPECT_THROW(to<bool>(Src("one")), std::range_error);
  EXPECT_THROW(to<bool>(Src("true_")), std::range_error);
  EXPECT_THROW(to<bool>(Src("bogus_token_that_is_too_long")), std::range_error);
}

TEST(Conv, StringToBool) {
  // testStr2Bool<const char *>();
  testStr2Bool<std::string>();

  // Test with strings that are not NUL terminated.
  const char buf[] = "01234";
  EXPECT_FALSE(to<bool>(StringPiece(buf, buf + 1))); // "0"
  EXPECT_TRUE(to<bool>(StringPiece(buf + 1, buf + 2))); // "1"
  const char buf2[] = "one two three";
  EXPECT_TRUE(to<bool>(StringPiece(buf2, buf2 + 2))); // "on"
  const char buf3[] = "false";
  EXPECT_THROW(
      to<bool>(StringPiece(buf3, buf3 + 3)), // "fal"
      std::range_error);

  // Test the StringPiece* API
  const char buf4[] = "001foo";
  StringPiece sp4(buf4);
  EXPECT_TRUE(to<bool>(&sp4));
  EXPECT_EQ(buf4 + 3, sp4.begin());
  const char buf5[] = "0012";
  StringPiece sp5(buf5);
  EXPECT_THROW(to<bool>(&sp5), std::range_error);
  EXPECT_EQ(buf5, sp5.begin());
}

TEST(Conv, Transform) {
  const std::vector<int64_t> in{1, 2, 3};
  std::vector<std::string> out(in.size());
  std::transform(in.begin(), in.end(), out.begin(), to<std::string, int64_t>);
  const std::vector<std::string> ref{"1", "2", "3"};
  EXPECT_EQ(ref, out);
}

TEST(Conv, FloatToInt) {
  EXPECT_EQ(to<int>(42.0f), 42);
  EXPECT_EQ(to<int8_t>(-128.0f), int8_t(-128));
  EXPECT_THROW(to<int8_t>(-129.0), std::range_error);
  EXPECT_THROW(to<int8_t>(127.001), std::range_error);
  EXPECT_THROW(to<uint8_t>(-0.0001), std::range_error);
  EXPECT_THROW(
      to<uint64_t>(static_cast<float>(std::numeric_limits<uint64_t>::max())),
      std::range_error);
}

TEST(Conv, IntToFloat) {
  EXPECT_EQ(to<float>(42ULL), 42.0);
  EXPECT_EQ(to<float>(int8_t(-128)), -128.0);
  EXPECT_THROW(
      to<float>(std::numeric_limits<uint64_t>::max()), std::range_error);
  EXPECT_THROW(
      to<float>(std::numeric_limits<int64_t>::max()), std::range_error);
  EXPECT_THROW(
      to<float>(std::numeric_limits<int64_t>::min() + 1), std::range_error);
#if FOLLY_HAVE_INT128_T
  EXPECT_THROW(
      to<double>(std::numeric_limits<unsigned __int128>::max()),
      std::range_error);
  EXPECT_THROW(
      to<double>(std::numeric_limits<__int128>::max()), std::range_error);
  EXPECT_THROW(
      to<double>(std::numeric_limits<__int128>::min() + 1), std::range_error);
#endif
}

TEST(Conv, BoolToFloat) {
  EXPECT_EQ(to<double>(true), 1.0);
  EXPECT_EQ(to<double>(false), 0.0);
}

TEST(Conv, FloatToBool) {
  EXPECT_EQ(to<bool>(1.0), true);
  EXPECT_EQ(to<bool>(0.0), false);
  EXPECT_EQ(to<bool>(2.7), true);
  EXPECT_EQ(to<bool>(std::numeric_limits<double>::max()), true);
  EXPECT_EQ(to<bool>(std::numeric_limits<double>::min()), true);
  EXPECT_EQ(to<bool>(std::numeric_limits<double>::lowest()), true);
  EXPECT_EQ(to<bool>(std::numeric_limits<double>::quiet_NaN()), true);
  EXPECT_EQ(to<bool>(std::numeric_limits<double>::infinity()), true);
  EXPECT_EQ(to<bool>(-std::numeric_limits<double>::infinity()), true);
}

namespace {

template <typename F>
void testConvError(
    F&& expr,
    const char* exprStr,
    ConversionCode code,
    const char* value,
    bool quotedValue,
    int line) {
  std::string where = to<std::string>(__FILE__, "(", line, "): ");
  try {
    auto res = expr();
    ADD_FAILURE() << where << exprStr << " -> " << res;
  } catch (const ConversionError& e) {
    EXPECT_EQ(code, e.errorCode()) << where << exprStr;
    std::string str(e.what());
    EXPECT_FALSE(str.empty()) << where << exprStr << " -> " << str;
    auto pos = str.find(':');
    if (value) {
      std::ostringstream exp;
      exp << str.substr(0, pos) + ": ";
      if (quotedValue) {
        exp << "\"" << value << "\"";
      } else {
        exp << value;
      }
      EXPECT_EQ(exp.str(), str) << where << exprStr << " -> " << str;
    } else {
      EXPECT_EQ(pos, std::string::npos) << where << exprStr << " -> " << str;
    }
  }
}
} // namespace

#define EXPECT_CONV_ERROR_QUOTE(expr, code, value, quoted) \
  testConvError(                                           \
      [&] { return expr; },                                \
      #expr,                                               \
      ConversionCode::code,                                \
      value,                                               \
      quoted,                                              \
      __LINE__)

#define EXPECT_CONV_ERROR(expr, code, value) \
  EXPECT_CONV_ERROR_QUOTE(expr, code, value, true)

#define EXPECT_CONV_ERROR_STR(type, str, code) \
  EXPECT_CONV_ERROR(to<type>(str), code, str)

#define EXPECT_CONV_ERROR_STR_NOVAL(type, str, code) \
  EXPECT_CONV_ERROR(to<type>(str), code, nullptr)

TEST(Conv, ConversionErrorStrToBool) {
  EXPECT_CONV_ERROR_STR_NOVAL(bool, StringPiece(), EMPTY_INPUT_STRING);
  EXPECT_CONV_ERROR_STR_NOVAL(bool, "", EMPTY_INPUT_STRING);
  EXPECT_CONV_ERROR_STR(bool, "  ", EMPTY_INPUT_STRING);
  EXPECT_CONV_ERROR_STR(bool, " 11 ", BOOL_OVERFLOW);
  EXPECT_CONV_ERROR_STR(bool, "other ", BOOL_INVALID_VALUE);
  EXPECT_CONV_ERROR_STR(bool, " bla", BOOL_INVALID_VALUE);
  EXPECT_CONV_ERROR(to<bool>("  offbla"), NON_WHITESPACE_AFTER_END, "bla");
}

TEST(Conv, ConversionErrorStrToFloat) {
  EXPECT_CONV_ERROR_STR_NOVAL(float, StringPiece(), EMPTY_INPUT_STRING);
  EXPECT_CONV_ERROR_STR_NOVAL(float, "", EMPTY_INPUT_STRING);
  EXPECT_CONV_ERROR_STR(float, "  ", EMPTY_INPUT_STRING);
  EXPECT_CONV_ERROR_STR(float, "  junk", STRING_TO_FLOAT_ERROR);
  EXPECT_CONV_ERROR(to<float>("  1bla"), NON_WHITESPACE_AFTER_END, "bla");
}

TEST(Conv, ConversionErrorStrToInt) {
  // empty string handling
  EXPECT_CONV_ERROR_STR_NOVAL(int, StringPiece(), EMPTY_INPUT_STRING);
  EXPECT_CONV_ERROR_STR_NOVAL(int, "", EMPTY_INPUT_STRING);
  EXPECT_CONV_ERROR_STR(int, "  ", EMPTY_INPUT_STRING);

  // signed integers
  EXPECT_CONV_ERROR_STR(int, "  *", INVALID_LEADING_CHAR);
  EXPECT_CONV_ERROR_STR(int, "  +", NO_DIGITS);
  EXPECT_CONV_ERROR_STR(int, "  +*", NON_DIGIT_CHAR);
  EXPECT_CONV_ERROR_STR(int8_t, "  128", POSITIVE_OVERFLOW);
  EXPECT_CONV_ERROR_STR(int8_t, " -129", NEGATIVE_OVERFLOW);
  EXPECT_CONV_ERROR_STR(int8_t, " 1000", POSITIVE_OVERFLOW);
  EXPECT_CONV_ERROR_STR(int8_t, "-1000", NEGATIVE_OVERFLOW);
  EXPECT_CONV_ERROR(to<int>(" -13bla"), NON_WHITESPACE_AFTER_END, "bla");

  // unsigned integers
  EXPECT_CONV_ERROR_STR(unsigned, "  -", NON_DIGIT_CHAR);
  EXPECT_CONV_ERROR_STR(uint8_t, " 256", POSITIVE_OVERFLOW);
  EXPECT_CONV_ERROR(to<unsigned>("42bla"), NON_WHITESPACE_AFTER_END, "bla");
}

#define EXPECT_CONV_ERROR_PP_VAL(type, str, code, val)                  \
  do {                                                                  \
    StringPiece input(str);                                             \
    EXPECT_CONV_ERROR(to<type>(input.begin(), input.end()), code, val); \
  } while (0)

#define EXPECT_CONV_ERROR_PP(type, str, code) \
  EXPECT_CONV_ERROR_PP_VAL(type, str, code, str)

TEST(Conv, ConversionErrorPtrPairToInt) {
  // signed integers
  EXPECT_CONV_ERROR_PP(int, "", INVALID_LEADING_CHAR);
  EXPECT_CONV_ERROR_PP(int, " ", INVALID_LEADING_CHAR);
  EXPECT_CONV_ERROR_PP(int, "*", INVALID_LEADING_CHAR);
  EXPECT_CONV_ERROR_PP(int, "+", NO_DIGITS);
  EXPECT_CONV_ERROR_PP(int8_t, "128", POSITIVE_OVERFLOW);
  EXPECT_CONV_ERROR_PP(int8_t, "-129", NEGATIVE_OVERFLOW);
  EXPECT_CONV_ERROR_PP(int8_t, "1000", POSITIVE_OVERFLOW);
  EXPECT_CONV_ERROR_PP(int8_t, "-1000", NEGATIVE_OVERFLOW);
  EXPECT_CONV_ERROR_PP(int, "-junk", NON_DIGIT_CHAR);

  // unsigned integers
  EXPECT_CONV_ERROR_PP(unsigned, "", NO_DIGITS);
  EXPECT_CONV_ERROR_PP(uint8_t, "256", POSITIVE_OVERFLOW);
  EXPECT_CONV_ERROR_PP(unsigned, "junk", NON_DIGIT_CHAR);
}

namespace {

template <typename T, typename V>
std::string prefixWithType(V value) {
  std::ostringstream oss;
#ifdef FOLLY_HAS_RTTI
  oss << "(" << demangle(typeid(T)) << ") ";
#endif
  oss << to<std::string>(value);
  return oss.str();
}
} // namespace

#define EXPECT_CONV_ERROR_ARITH(type, val, code) \
  EXPECT_CONV_ERROR_QUOTE(                       \
      to<type>(val), code, prefixWithType<type>(val).c_str(), false)

TEST(Conv, ConversionErrorIntToInt) {
  EXPECT_CONV_ERROR_ARITH(signed char, 128, ARITH_POSITIVE_OVERFLOW);
  EXPECT_CONV_ERROR_ARITH(unsigned char, -1, ARITH_NEGATIVE_OVERFLOW);
}

TEST(Conv, ConversionErrorFloatToFloat) {
  EXPECT_CONV_ERROR_ARITH(
      float, std::numeric_limits<double>::max(), ARITH_POSITIVE_OVERFLOW);
  EXPECT_CONV_ERROR_ARITH(
      float, std::numeric_limits<double>::lowest(), ARITH_NEGATIVE_OVERFLOW);
}

TEST(Conv, ConversionErrorIntToFloat) {
  EXPECT_CONV_ERROR_ARITH(
      float, std::numeric_limits<long long>::max(), ARITH_LOSS_OF_PRECISION);
}

TEST(Conv, ConversionErrorFloatToInt) {
  EXPECT_CONV_ERROR_ARITH(int8_t, 65.5, ARITH_LOSS_OF_PRECISION);
}

TEST(Conv, TryStringToBool) {
  auto rv1 = folly::tryTo<bool>("xxxx");
  EXPECT_FALSE(rv1.hasValue());
  auto rv2 = folly::tryTo<bool>("false");
  EXPECT_TRUE(rv2.hasValue());
  EXPECT_FALSE(rv2.value());
  auto rv3 = folly::tryTo<bool>("yes");
  EXPECT_TRUE(rv3.hasValue());
  EXPECT_TRUE(rv3.value());
}

TEST(Conv, TryStringToInt) {
  auto rv1 = folly::tryTo<int>("1000000000000000000000000000000");
  EXPECT_FALSE(rv1.hasValue());
  auto rv2 = folly::tryTo<int>("4711");
  EXPECT_TRUE(rv2.hasValue());
  EXPECT_EQ(rv2.value(), 4711);
}

TEST(Conv, TryStringToEnum) {
  enum class A { x = 42, y = 420, z = 65 };
  auto rv1 = folly::tryTo<A>("1000000000000000000000000000000");
  EXPECT_FALSE(rv1.hasValue());
  auto rv2 = folly::tryTo<A>("42");
  EXPECT_TRUE(rv2.hasValue());
  EXPECT_EQ(A::x, rv2.value());
  auto rv3 = folly::tryTo<A>("50");
  EXPECT_TRUE(rv3.hasValue());
  EXPECT_EQ(static_cast<A>(50), rv3.value());
}

TEST(Conv, TryStringToFloat) {
  auto rv1 = folly::tryTo<float>("");
  EXPECT_FALSE(rv1.hasValue());
  auto rv2 = folly::tryTo<float>("3.14");
  EXPECT_TRUE(rv2.hasValue());
  EXPECT_NEAR(rv2.value(), 3.14, 1e-5);
}

TEST(Conv, TryStringToDouble) {
  auto rv1 = folly::tryTo<double>("");
  EXPECT_FALSE(rv1.hasValue());
  auto rv2 = folly::tryTo<double>("3.14");
  EXPECT_TRUE(rv2.hasValue());
  EXPECT_NEAR(rv2.value(), 3.14, 1e-10);
}

TEST(Conv, TryIntToInt) {
  auto rv1 = folly::tryTo<uint8_t>(256);
  EXPECT_FALSE(rv1.hasValue());
  auto rv2 = folly::tryTo<uint8_t>(255);
  EXPECT_TRUE(rv2.hasValue());
  EXPECT_EQ(rv2.value(), 255);
}

TEST(Conv, TryFloatToFloat) {
  auto rv1 = folly::tryTo<float>(1e100);
  EXPECT_FALSE(rv1.hasValue());
  auto rv2 = folly::tryTo<double>(25.5f);
  EXPECT_TRUE(rv2.hasValue());
  EXPECT_NEAR(rv2.value(), 25.5, 1e-10);
}

TEST(Conv, TryFloatToInt) {
  auto rv1 = folly::tryTo<int>(100.001);
  EXPECT_FALSE(rv1.hasValue());
  auto rv2 = folly::tryTo<int>(100.0);
  EXPECT_TRUE(rv2.hasValue());
  EXPECT_EQ(rv2.value(), 100);
}

TEST(Conv, TryIntToFloat) {
  auto rv1 = folly::tryTo<float>(std::numeric_limits<uint64_t>::max());
  EXPECT_FALSE(rv1.hasValue());
  auto rv2 = folly::tryTo<float>(1000ULL);
  EXPECT_TRUE(rv2.hasValue());
  EXPECT_EQ(rv2.value(), 1000.0f);
}

TEST(Conv, TryPtrPairToInt) {
  StringPiece sp1("1000000000000000000000000000000");
  auto rv1 = folly::tryTo<int>(sp1.begin(), sp1.end());
  EXPECT_FALSE(rv1.hasValue());
  StringPiece sp2("4711");
  auto rv2 = folly::tryTo<int>(sp2.begin(), sp2.end());
  EXPECT_TRUE(rv2.hasValue());
  EXPECT_EQ(rv2.value(), 4711);
  StringPiece sp3("-4711");
  auto rv3 = folly::tryTo<int>(sp3.begin(), sp3.end());
  EXPECT_TRUE(rv3.hasValue());
  EXPECT_EQ(rv3.value(), -4711);
  StringPiece sp4("4711");
  auto rv4 = folly::tryTo<uint16_t>(sp4.begin(), sp4.end());
  EXPECT_TRUE(rv4.hasValue());
  EXPECT_EQ(rv4.value(), 4711);
}

TEST(Conv, NewUint64ToString) {
  char buf[21];

#define THE_GREAT_EXPECTATIONS(n, len)                \
  do {                                                \
    EXPECT_EQ((len), uint64ToBufferUnsafe((n), buf)); \
    buf[(len)] = 0;                                   \
    auto s = string(#n);                              \
    s = s.substr(0, s.size() - 2);                    \
    EXPECT_EQ(s, buf);                                \
  } while (0)

  THE_GREAT_EXPECTATIONS(0UL, 1);
  THE_GREAT_EXPECTATIONS(1UL, 1);
  THE_GREAT_EXPECTATIONS(12UL, 2);
  THE_GREAT_EXPECTATIONS(123UL, 3);
  THE_GREAT_EXPECTATIONS(1234UL, 4);
  THE_GREAT_EXPECTATIONS(12345UL, 5);
  THE_GREAT_EXPECTATIONS(123456UL, 6);
  THE_GREAT_EXPECTATIONS(1234567UL, 7);
  THE_GREAT_EXPECTATIONS(12345678UL, 8);
  THE_GREAT_EXPECTATIONS(123456789UL, 9);
  THE_GREAT_EXPECTATIONS(1234567890UL, 10);
  THE_GREAT_EXPECTATIONS(12345678901UL, 11);
  THE_GREAT_EXPECTATIONS(123456789012UL, 12);
  THE_GREAT_EXPECTATIONS(1234567890123UL, 13);
  THE_GREAT_EXPECTATIONS(12345678901234UL, 14);
  THE_GREAT_EXPECTATIONS(123456789012345UL, 15);
  THE_GREAT_EXPECTATIONS(1234567890123456UL, 16);
  THE_GREAT_EXPECTATIONS(12345678901234567UL, 17);
  THE_GREAT_EXPECTATIONS(123456789012345678UL, 18);
  THE_GREAT_EXPECTATIONS(1234567890123456789UL, 19);
  THE_GREAT_EXPECTATIONS(18446744073709551614UL, 20);
  THE_GREAT_EXPECTATIONS(18446744073709551615UL, 20);

#undef THE_GREAT_EXPECTATIONS
}

TEST(Conv, allocate_size) {
  std::string str1 = "meh meh meh";
  std::string str2 = "zdech zdech zdech";

  auto res1 = folly::to<std::string>(str1, ".", str2);
  EXPECT_EQ(res1, str1 + "." + str2);

  std::string res2; // empty
  toAppendFit(str1, str2, 1, &res2);
  EXPECT_EQ(res2, str1 + str2 + "1");

  std::string res3;
  toAppendDelimFit(",", str1, str2, &res3);
  EXPECT_EQ(res3, str1 + "," + str2);
}

namespace my {
struct Dimensions {
  int w, h;
  std::tuple<const int&, const int&> tuple_view() const {
    return tie(w, h);
  }
  bool operator==(const Dimensions& other) const {
    return this->tuple_view() == other.tuple_view();
  }
};

Expected<StringPiece, ConversionCode> parseTo(
    folly::StringPiece in,
    Dimensions& out) {
  return parseTo(in, out.w)
      .then([](StringPiece sp) { return sp.removePrefix("x"), sp; })
      .then([&](StringPiece sp) { return parseTo(sp, out.h); });
}

template <class String>
void toAppend(const Dimensions& in, String* result) {
  folly::toAppend(in.w, 'x', in.h, result);
}

size_t estimateSpaceNeeded(const Dimensions& in) {
  return 2000 + folly::estimateSpaceNeeded(in.w) +
      folly::estimateSpaceNeeded(in.h);
}

enum class SmallEnum {};

Expected<StringPiece, ConversionCode> parseTo(StringPiece in, SmallEnum& out) {
  out = {};
  if (in == "SmallEnum") {
    return in.removePrefix(in), in;
  } else {
    return makeUnexpected(ConversionCode::STRING_TO_FLOAT_ERROR);
  }
}

template <class String>
void toAppend(SmallEnum, String* result) {
  folly::toAppend("SmallEnum", result);
}
} // namespace my

TEST(Conv, custom_kkproviders) {
  my::Dimensions expected{7, 8};
  EXPECT_EQ(expected, folly::to<my::Dimensions>("7x8"));
  auto str = folly::to<std::string>(expected);
  EXPECT_EQ("7x8", str);
  // make sure above implementation of estimateSpaceNeeded() is used.
  EXPECT_GT(str.capacity(), 2000);
  EXPECT_LT(str.capacity(), 2500);
  // toAppend with other arguments
  toAppend("|", expected, &str);
  EXPECT_EQ("7x8|7x8", str);
}

TEST(conv, custom_enumclass) {
  EXPECT_EQ(my::SmallEnum{}, folly::to<my::SmallEnum>("SmallEnum"));
  EXPECT_EQ(my::SmallEnum{}, folly::tryTo<my::SmallEnum>("SmallEnum").value());
  auto str = to<string>(my::SmallEnum{});
  toAppend("|", my::SmallEnum{}, &str);
  EXPECT_EQ("SmallEnum|SmallEnum", str);
}

TEST(Conv, TryToThenWithVoid) {
  auto x = tryTo<int>("42").then([](int) {});
  EXPECT_TRUE(x.hasValue());
  Unit u = x.value();
  (void)u;
}

TEST(conv, TryIntToUnscopedEnumAndBack) {
  enum UnscopedEnum {
    First = 0,
    Second = 1,
  };
  EXPECT_EQ(UnscopedEnum::Second, folly::tryTo<UnscopedEnum>(1).value());
  EXPECT_EQ(1, folly::tryTo<int>(UnscopedEnum::Second).value());
}

TEST(conv, TryIntToScopedEnumAndBack) {
  enum class ScopedEnum {
    First = 0,
    Second = 1,
  };
  EXPECT_EQ(ScopedEnum::Second, folly::tryTo<ScopedEnum>(1).value());
  EXPECT_EQ(1, folly::tryTo<int>(ScopedEnum::Second).value());
}
