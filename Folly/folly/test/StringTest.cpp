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

#ifndef __STDC_FORMAT_MACROS
#define __STDC_FORMAT_MACROS 1
#endif

#include <folly/String.h>
#include <tuple>

#include <cinttypes>
#include <set>

#include <boost/regex.hpp>

#include <folly/container/Array.h>
#include <folly/portability/GTest.h>
#include <folly/test/TestUtils.h>

using namespace folly;
using namespace std;

TEST(StringPrintf, BasicTest) {
  EXPECT_EQ("abc", stringPrintf("%s", "abc"));
  EXPECT_EQ("abc", stringPrintf("%sbc", "a"));
  EXPECT_EQ("abc", stringPrintf("a%sc", "b"));
  EXPECT_EQ("abc", stringPrintf("ab%s", "c"));

  EXPECT_EQ("abc", stringPrintf("abc"));
}

TEST(StringPrintf, NumericFormats) {
  EXPECT_EQ("12", stringPrintf("%d", 12));
  EXPECT_EQ("2000000000", stringPrintf("%ld", 2000000000UL));
  EXPECT_EQ("2000000000", stringPrintf("%ld", 2000000000L));
  EXPECT_EQ("-2000000000", stringPrintf("%ld", -2000000000L));
  EXPECT_EQ("5000000000", stringPrintf("%lld", 5000000000ULL));
  EXPECT_EQ("5000000000", stringPrintf("%lld", 5000000000LL));
  EXPECT_EQ("-5000000000", stringPrintf("%lld", -5000000000LL));
  EXPECT_EQ("-1", stringPrintf("%d", 0xffffffff));
  EXPECT_EQ(
      "-1",
      stringPrintf("%" PRId64, static_cast<int64_t>(0xffffffffffffffffLL)));
  EXPECT_EQ(
      "-1",
      stringPrintf("%" PRId64, static_cast<uint64_t>(0xffffffffffffffffULL)));

  EXPECT_EQ("7.7", stringPrintf("%1.1f", 7.7));
  EXPECT_EQ("7.7", stringPrintf("%1.1lf", 7.7));
  EXPECT_EQ("7.70000000000000018", stringPrintf("%.17f", 7.7));
  EXPECT_EQ("7.70000000000000018", stringPrintf("%.17lf", 7.7));
}

TEST(StringPrintf, Appending) {
  string s;
  stringAppendf(&s, "a%s", "b");
  stringAppendf(&s, "%c", 'c');
  EXPECT_EQ(s, "abc");
  stringAppendf(&s, " %d", 123);
  EXPECT_EQ(s, "abc 123");
}

void vprintfCheck(const char* expected, const char* fmt, ...) {
  va_list apOrig;
  va_start(apOrig, fmt);
  SCOPE_EXIT {
    va_end(apOrig);
  };
  va_list ap;
  va_copy(ap, apOrig);
  SCOPE_EXIT {
    va_end(ap);
  };

  // Check both APIs for calling stringVPrintf()
  EXPECT_EQ(expected, stringVPrintf(fmt, ap));
  va_end(ap);
  va_copy(ap, apOrig);

  std::string out;
  stringVPrintf(&out, fmt, ap);
  va_end(ap);
  va_copy(ap, apOrig);
  EXPECT_EQ(expected, out);

  // Check stringVAppendf() as well
  std::string prefix = "foobar";
  out = prefix;
  EXPECT_EQ(prefix + expected, stringVAppendf(&out, fmt, ap));
  va_end(ap);
  va_copy(ap, apOrig);
}

void vprintfError(const char* fmt, ...) {
  va_list ap;
  va_start(ap, fmt);
  SCOPE_EXIT {
    va_end(ap);
  };

#ifdef HAVE_VSNPRINTF_ERRORS
  // OSX's sprintf family does not return a negative number on a bad format
  // string, but Linux does. It's unclear to me which behavior is more
  // correct.
  EXPECT_THROW({ stringVPrintf(fmt, ap); }, std::runtime_error);
#endif
}

TEST(StringPrintf, VPrintf) {
  vprintfCheck("foo", "%s", "foo");
  vprintfCheck(
      "long string requiring reallocation 1 2 3 0x12345678",
      "%s %s %d %d %d %#x",
      "long string",
      "requiring reallocation",
      1,
      2,
      3,
      0x12345678);
  vprintfError("bogus%", "foo");
}

TEST(StringPrintf, VariousSizes) {
  // Test a wide variety of output sizes, making sure to cross the
  // vsnprintf buffer boundary implementation detail.
  for (int i = 0; i < 4096; ++i) {
    string expected(i + 1, 'a');
    expected = "X" + expected + "X";
    string result = stringPrintf("%s", expected.c_str());
    EXPECT_EQ(expected.size(), result.size());
    EXPECT_EQ(expected, result);
  }

  // clang-format off
  EXPECT_EQ("abc12345678910111213141516171819202122232425xyz",
            stringPrintf("abc%d%d%d%d%d%d%d%d%d%d%d%d%d%d"
                         "%d%d%d%d%d%d%d%d%d%d%dxyz",
                         1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
                         17, 18, 19, 20, 21, 22, 23, 24, 25));
  // clang-format on
}

TEST(StringPrintf, oldStringPrintfTests) {
  EXPECT_EQ(string("a/b/c/d"), stringPrintf("%s/%s/%s/%s", "a", "b", "c", "d"));

  EXPECT_EQ(string("    5    10"), stringPrintf("%5d %5d", 5, 10));

  // check printing w/ a big buffer
  for (int size = (1 << 8); size <= (1 << 15); size <<= 1) {
    string a(size, 'z');
    string b = stringPrintf("%s", a.c_str());
    EXPECT_EQ(a.size(), b.size());
  }
}

TEST(StringPrintf, oldStringAppendf) {
  string s = "hello";
  stringAppendf(&s, "%s/%s/%s/%s", "a", "b", "c", "d");
  EXPECT_EQ(string("helloa/b/c/d"), s);
}

TEST(Escape, cEscape) {
  EXPECT_EQ("hello world", cEscape<std::string>("hello world"));
  EXPECT_EQ(
      "hello \\\\world\\\" goodbye",
      cEscape<std::string>("hello \\world\" goodbye"));
  EXPECT_EQ("hello\\nworld", cEscape<std::string>("hello\nworld"));
  EXPECT_EQ("hello\\377\\376", cEscape<std::string>("hello\xff\xfe"));
}

TEST(Escape, cUnescape) {
  EXPECT_EQ("hello world", cUnescape<std::string>("hello world"));
  EXPECT_EQ(
      "hello \\world\" goodbye",
      cUnescape<std::string>("hello \\\\world\\\" goodbye"));
  EXPECT_EQ("hello\nworld", cUnescape<std::string>("hello\\nworld"));
  EXPECT_EQ("hello\nworld", cUnescape<std::string>("hello\\012world"));
  EXPECT_EQ("hello\nworld", cUnescape<std::string>("hello\\x0aworld"));
  EXPECT_EQ("hello\xff\xfe", cUnescape<std::string>("hello\\377\\376"));
  EXPECT_EQ("hello\xff\xfe", cUnescape<std::string>("hello\\xff\\xfe"));
  EXPECT_EQ("hello\\", cUnescape<std::string>("hello\\", false));

  EXPECT_THROW_RE(
      cUnescape<std::string>("hello\\"),
      std::invalid_argument,
      "incomplete escape sequence");
  EXPECT_THROW_RE(
      cUnescape<std::string>("hello\\x"),
      std::invalid_argument,
      "incomplete hex escape sequence");
  EXPECT_THROW_RE(
      cUnescape<std::string>("hello\\q"),
      std::invalid_argument,
      "invalid escape sequence");
}

TEST(Escape, uriEscape) {
  EXPECT_EQ("hello%2c%20%2fworld", uriEscape<std::string>("hello, /world"));
  EXPECT_EQ(
      "hello%2c%20/world",
      uriEscape<std::string>("hello, /world", UriEscapeMode::PATH));
  EXPECT_EQ(
      "hello%2c+%2fworld",
      uriEscape<std::string>("hello, /world", UriEscapeMode::QUERY));
  EXPECT_EQ(
      "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_.~",
      uriEscape<std::string>(
          "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_.~"));
}

TEST(Escape, uriUnescape) {
  EXPECT_EQ("hello, /world", uriUnescape<std::string>("hello, /world"));
  EXPECT_EQ("hello, /world", uriUnescape<std::string>("hello%2c%20%2fworld"));
  EXPECT_EQ("hello,+/world", uriUnescape<std::string>("hello%2c+%2fworld"));
  EXPECT_EQ(
      "hello, /world",
      uriUnescape<std::string>("hello%2c+%2fworld", UriEscapeMode::QUERY));
  EXPECT_EQ("hello/", uriUnescape<std::string>("hello%2f"));
  EXPECT_EQ("hello/", uriUnescape<std::string>("hello%2F"));
  EXPECT_THROW({ uriUnescape<std::string>("hello%"); }, std::invalid_argument);
  EXPECT_THROW({ uriUnescape<std::string>("hello%2"); }, std::invalid_argument);
  EXPECT_THROW(
      { uriUnescape<std::string>("hello%2g"); }, std::invalid_argument);
}

namespace {
void expectPrintable(StringPiece s) {
  for (char c : s) {
    EXPECT_LE(32, c);
    EXPECT_GE(127, c);
  }
}
} // namespace

TEST(Escape, uriEscapeAllCombinations) {
  char c[3];
  c[2] = '\0';
  StringPiece in(c, 2);
  fbstring tmp;
  fbstring out;
  for (int i = 0; i < 256; ++i) {
    c[0] = i;
    for (int j = 0; j < 256; ++j) {
      c[1] = j;
      tmp.clear();
      out.clear();
      uriEscape(in, tmp);
      expectPrintable(tmp);
      uriUnescape(tmp, out);
      EXPECT_EQ(in, out);
    }
  }
}

namespace {
bool isHex(int v) {
  return (
      (v >= '0' && v <= '9') || (v >= 'A' && v <= 'F') ||
      (v >= 'a' && v <= 'f'));
}
} // namespace

TEST(Escape, uriUnescapePercentDecoding) {
  char c[4] = {'%', '\0', '\0', '\0'};
  StringPiece in(c, 3);
  fbstring out;
  unsigned int expected = 0;
  for (int i = 0; i < 256; ++i) {
    c[1] = i;
    for (int j = 0; j < 256; ++j) {
      c[2] = j;
      if (isHex(i) && isHex(j)) {
        out.clear();
        uriUnescape(in, out);
        EXPECT_EQ(1, out.size());
        EXPECT_EQ(1, sscanf(c + 1, "%x", &expected));
        unsigned char v = out[0];
        EXPECT_EQ(expected, v);
      } else {
        EXPECT_THROW({ uriUnescape(in, out); }, std::invalid_argument);
      }
    }
  }
}

namespace {

double pow2(int exponent) {
  return double(int64_t(1) << exponent);
}

} // namespace

struct PrettyTestCase {
  std::string prettyString;
  double realValue;
  PrettyType prettyType;
};

PrettyTestCase prettyTestCases[] = {
    {string("853 ms"), 85.3e-2, PRETTY_TIME_HMS},
    {string("8.53 s "), 85.3e-1, PRETTY_TIME_HMS},
    {string("1.422 m "), 85.3, PRETTY_TIME_HMS},
    {string("14.22 m "), 85.3e1, PRETTY_TIME_HMS},
    {string("2.369 h "), 85.3e2, PRETTY_TIME_HMS},
    {string("2.369e+04 h "), 85.3e6, PRETTY_TIME_HMS},

    {string("8.53e+07 s "), 85.3e6, PRETTY_TIME},
    {string("8.53e+07 s "), 85.3e6, PRETTY_TIME},
    {string("85.3 ms"), 85.3e-3, PRETTY_TIME},
    {string("85.3 us"), 85.3e-6, PRETTY_TIME},
    {string("85.3 ns"), 85.3e-9, PRETTY_TIME},
    {string("85.3 ps"), 85.3e-12, PRETTY_TIME},
    {string("8.53e-14 s "), 85.3e-15, PRETTY_TIME},

    {string("0 s "), 0, PRETTY_TIME},
    {string("1 s "), 1.0, PRETTY_TIME},
    {string("1 ms"), 1.0e-3, PRETTY_TIME},
    {string("1 us"), 1.0e-6, PRETTY_TIME},
    {string("1 ns"), 1.0e-9, PRETTY_TIME},
    {string("1 ps"), 1.0e-12, PRETTY_TIME},

    // check bytes printing
    {string("853 B "), 853., PRETTY_BYTES},
    {string("833 kB"), 853.e3, PRETTY_BYTES},
    {string("813.5 MB"), 853.e6, PRETTY_BYTES},
    {string("7.944 GB"), 8.53e9, PRETTY_BYTES},
    {string("794.4 GB"), 853.e9, PRETTY_BYTES},
    {string("775.8 TB"), 853.e12, PRETTY_BYTES},

    {string("0 B "), 0, PRETTY_BYTES},
    {string("1 B "), pow2(0), PRETTY_BYTES},
    {string("1 kB"), pow2(10), PRETTY_BYTES},
    {string("1 MB"), pow2(20), PRETTY_BYTES},
    {string("1 GB"), pow2(30), PRETTY_BYTES},
    {string("1 TB"), pow2(40), PRETTY_BYTES},
    {string("1 PB"), pow2(50), PRETTY_BYTES},
    {string("1 EB"), pow2(60), PRETTY_BYTES},

    {string("853 B  "), 853., PRETTY_BYTES_IEC},
    {string("833 KiB"), 853.e3, PRETTY_BYTES_IEC},
    {string("813.5 MiB"), 853.e6, PRETTY_BYTES_IEC},
    {string("7.944 GiB"), 8.53e9, PRETTY_BYTES_IEC},
    {string("794.4 GiB"), 853.e9, PRETTY_BYTES_IEC},
    {string("775.8 TiB"), 853.e12, PRETTY_BYTES_IEC},
    {string("1.776 PiB"), 2e15, PRETTY_BYTES_IEC},
    {string("1.735 EiB"), 2e18, PRETTY_BYTES_IEC},

    {string("0 B  "), 0, PRETTY_BYTES_IEC},
    {string("1 B  "), pow2(0), PRETTY_BYTES_IEC},
    {string("1 KiB"), pow2(10), PRETTY_BYTES_IEC},
    {string("1 MiB"), pow2(20), PRETTY_BYTES_IEC},
    {string("1 GiB"), pow2(30), PRETTY_BYTES_IEC},
    {string("1 TiB"), pow2(40), PRETTY_BYTES_IEC},
    {string("1 PiB"), pow2(50), PRETTY_BYTES_IEC},
    {string("1 EiB"), pow2(60), PRETTY_BYTES_IEC},

    // check bytes metric printing
    {string("853 B "), 853., PRETTY_BYTES_METRIC},
    {string("853 kB"), 853.e3, PRETTY_BYTES_METRIC},
    {string("853 MB"), 853.e6, PRETTY_BYTES_METRIC},
    {string("8.53 GB"), 8.53e9, PRETTY_BYTES_METRIC},
    {string("853 GB"), 853.e9, PRETTY_BYTES_METRIC},
    {string("853 TB"), 853.e12, PRETTY_BYTES_METRIC},

    {string("0 B "), 0, PRETTY_BYTES_METRIC},
    {string("1 B "), 1.0, PRETTY_BYTES_METRIC},
    {string("1 kB"), 1.0e+3, PRETTY_BYTES_METRIC},
    {string("1 MB"), 1.0e+6, PRETTY_BYTES_METRIC},
    {string("1 GB"), 1.0e+9, PRETTY_BYTES_METRIC},
    {string("1 TB"), 1.0e+12, PRETTY_BYTES_METRIC},
    {string("1 PB"), 1.0e+15, PRETTY_BYTES_METRIC},
    {string("1 EB"), 1.0e+18, PRETTY_BYTES_METRIC},

    // check metric-units (powers of 1000) printing
    {string("853  "), 853., PRETTY_UNITS_METRIC},
    {string("853 k"), 853.e3, PRETTY_UNITS_METRIC},
    {string("853 M"), 853.e6, PRETTY_UNITS_METRIC},
    {string("8.53 bil"), 8.53e9, PRETTY_UNITS_METRIC},
    {string("853 bil"), 853.e9, PRETTY_UNITS_METRIC},
    {string("853 tril"), 853.e12, PRETTY_UNITS_METRIC},

    // check binary-units (powers of 1024) printing
    {string("0  "), 0, PRETTY_UNITS_BINARY},
    {string("1  "), pow2(0), PRETTY_UNITS_BINARY},
    {string("1 k"), pow2(10), PRETTY_UNITS_BINARY},
    {string("1 M"), pow2(20), PRETTY_UNITS_BINARY},
    {string("1 G"), pow2(30), PRETTY_UNITS_BINARY},
    {string("1 T"), pow2(40), PRETTY_UNITS_BINARY},

    {string("1023  "), pow2(10) - 1, PRETTY_UNITS_BINARY},
    {string("1024 k"), pow2(20) - 1, PRETTY_UNITS_BINARY},
    {string("1024 M"), pow2(30) - 1, PRETTY_UNITS_BINARY},
    {string("1024 G"), pow2(40) - 1, PRETTY_UNITS_BINARY},

    {string("0   "), 0, PRETTY_UNITS_BINARY_IEC},
    {string("1   "), pow2(0), PRETTY_UNITS_BINARY_IEC},
    {string("1 Ki"), pow2(10), PRETTY_UNITS_BINARY_IEC},
    {string("1 Mi"), pow2(20), PRETTY_UNITS_BINARY_IEC},
    {string("1 Gi"), pow2(30), PRETTY_UNITS_BINARY_IEC},
    {string("1 Ti"), pow2(40), PRETTY_UNITS_BINARY_IEC},

    {string("1023   "), pow2(10) - 1, PRETTY_UNITS_BINARY_IEC},
    {string("1024 Ki"), pow2(20) - 1, PRETTY_UNITS_BINARY_IEC},
    {string("1024 Mi"), pow2(30) - 1, PRETTY_UNITS_BINARY_IEC},
    {string("1024 Gi"), pow2(40) - 1, PRETTY_UNITS_BINARY_IEC},

    // check border SI cases

    {string("1 Y"), 1e24, PRETTY_SI},
    {string("10 Y"), 1e25, PRETTY_SI},
    {string("1 y"), 1e-24, PRETTY_SI},
    {string("10 y"), 1e-23, PRETTY_SI},

    // check that negative values work
    {string("-85.3 s "), -85.3, PRETTY_TIME},
    {string("-85.3 ms"), -85.3e-3, PRETTY_TIME},
    {string("-85.3 us"), -85.3e-6, PRETTY_TIME},
    {string("-85.3 ns"), -85.3e-9, PRETTY_TIME},

    // end of test
    {string("endoftest"), 0, PRETTY_NUM_TYPES},
};

TEST(PrettyPrint, Basic) {
  for (int i = 0; prettyTestCases[i].prettyType != PRETTY_NUM_TYPES; ++i) {
    const PrettyTestCase& prettyTest = prettyTestCases[i];
    EXPECT_EQ(
        prettyTest.prettyString,
        prettyPrint(prettyTest.realValue, prettyTest.prettyType));
  }
}

TEST(PrettyToDouble, Basic) {
  // check manually created tests
  for (int i = 0; prettyTestCases[i].prettyType != PRETTY_NUM_TYPES; ++i) {
    PrettyTestCase testCase = prettyTestCases[i];
    PrettyType formatType = testCase.prettyType;
    double x = testCase.realValue;
    std::string testString = testCase.prettyString;
    double recoveredX = 0;
    try {
      recoveredX = prettyToDouble(testString, formatType);
    } catch (const std::exception& ex) {
      ADD_FAILURE() << testCase.prettyString << " -> " << ex.what();
    }
    double relativeError =
        fabs(x) < 1e-5 ? (x - recoveredX) : (x - recoveredX) / x;
    EXPECT_NEAR(0, relativeError, 1e-3);
  }

  // checks for compatibility with prettyPrint over the whole parameter space
  for (int i = 0; i < PRETTY_NUM_TYPES; ++i) {
    PrettyType formatType = static_cast<PrettyType>(i);
    for (double x = 1e-18; x < 1e40; x *= 1.9) {
      bool addSpace = static_cast<PrettyType>(i) == PRETTY_SI;
      for (int it = 0; it < 2; ++it, addSpace = true) {
        double recoveredX = 0;
        try {
          recoveredX =
              prettyToDouble(prettyPrint(x, formatType, addSpace), formatType);
        } catch (const std::exception& ex) {
          ADD_FAILURE() << folly::exceptionStr(ex);
        }
        double relativeError = (x - recoveredX) / x;
        EXPECT_NEAR(0, relativeError, 1e-3);
      }
    }
  }

  // check for incorrect values
  EXPECT_THROW(prettyToDouble("10Mx", PRETTY_SI), std::range_error);
  EXPECT_THROW(prettyToDouble("10 Mx", PRETTY_SI), std::range_error);
  EXPECT_THROW(prettyToDouble("10 M x", PRETTY_SI), std::range_error);

  StringPiece testString = "10Mx";
  EXPECT_DOUBLE_EQ(prettyToDouble(&testString, PRETTY_UNITS_METRIC), 10e6);
  EXPECT_EQ(testString, "x");
}

TEST(PrettyPrint, HexDump) {
  std::string a("abc\x00\x02\xa0", 6); // embedded NUL
  EXPECT_EQ(
      "00000000  61 62 63 00 02 a0                                 "
      "|abc...          |\n",
      hexDump(a.data(), a.size()));

  a = "abcdefghijklmnopqrstuvwxyz";
  EXPECT_EQ(
      "00000000  61 62 63 64 65 66 67 68  69 6a 6b 6c 6d 6e 6f 70  "
      "|abcdefghijklmnop|\n"
      "00000010  71 72 73 74 75 76 77 78  79 7a                    "
      "|qrstuvwxyz      |\n",
      hexDump(a.data(), a.size()));
}

TEST(System, errnoStr) {
  errno = EACCES;
  EXPECT_EQ(EACCES, errno);
  EXPECT_EQ(EACCES, errno); // twice to make sure EXPECT_EQ doesn't change it

  fbstring expected = strerror(ENOENT);

  errno = EACCES;
  EXPECT_EQ(expected, errnoStr(ENOENT));
  // Ensure that errno isn't changed
  EXPECT_EQ(EACCES, errno);

  // Per POSIX, all errno values are positive, so -1 is invalid
  errnoStr(-1);

  // Ensure that errno isn't changed
  EXPECT_EQ(EACCES, errno);
}

namespace {

template <template <class, class> class VectorType>
void splitTest() {
  VectorType<string, std::allocator<string>> parts;

  folly::split(',', "a,b,c", parts);
  EXPECT_EQ(parts.size(), 3);
  EXPECT_EQ(parts[0], "a");
  EXPECT_EQ(parts[1], "b");
  EXPECT_EQ(parts[2], "c");
  parts.clear();

  folly::split(',', StringPiece("a,b,c"), parts);
  EXPECT_EQ(parts.size(), 3);
  EXPECT_EQ(parts[0], "a");
  EXPECT_EQ(parts[1], "b");
  EXPECT_EQ(parts[2], "c");
  parts.clear();

  folly::split(',', string("a,b,c"), parts);
  EXPECT_EQ(parts.size(), 3);
  EXPECT_EQ(parts[0], "a");
  EXPECT_EQ(parts[1], "b");
  EXPECT_EQ(parts[2], "c");
  parts.clear();

  folly::split(',', "a,,c", parts);
  EXPECT_EQ(parts.size(), 3);
  EXPECT_EQ(parts[0], "a");
  EXPECT_EQ(parts[1], "");
  EXPECT_EQ(parts[2], "c");
  parts.clear();

  folly::split(',', string("a,,c"), parts);
  EXPECT_EQ(parts.size(), 3);
  EXPECT_EQ(parts[0], "a");
  EXPECT_EQ(parts[1], "");
  EXPECT_EQ(parts[2], "c");
  parts.clear();

  folly::split(',', "a,,c", parts, true);
  EXPECT_EQ(parts.size(), 2);
  EXPECT_EQ(parts[0], "a");
  EXPECT_EQ(parts[1], "c");
  parts.clear();

  folly::split(',', string("a,,c"), parts, true);
  EXPECT_EQ(parts.size(), 2);
  EXPECT_EQ(parts[0], "a");
  EXPECT_EQ(parts[1], "c");
  parts.clear();

  folly::split(',', string(",,a,,c,,,"), parts, true);
  EXPECT_EQ(parts.size(), 2);
  EXPECT_EQ(parts[0], "a");
  EXPECT_EQ(parts[1], "c");
  parts.clear();

  // test multiple split w/o clear
  folly::split(',', ",,a,,c,,,", parts, true);
  EXPECT_EQ(parts.size(), 2);
  EXPECT_EQ(parts[0], "a");
  EXPECT_EQ(parts[1], "c");
  folly::split(',', ",,a,,c,,,", parts, true);
  EXPECT_EQ(parts.size(), 4);
  EXPECT_EQ(parts[2], "a");
  EXPECT_EQ(parts[3], "c");
  parts.clear();

  // test splits that with multi-line delimiter
  folly::split("ab", "dabcabkdbkab", parts, true);
  EXPECT_EQ(parts.size(), 3);
  EXPECT_EQ(parts[0], "d");
  EXPECT_EQ(parts[1], "c");
  EXPECT_EQ(parts[2], "kdbk");
  parts.clear();

  // test last part is shorter than the delimiter
  folly::split("bc", "abcd", parts, true);
  EXPECT_EQ(parts.size(), 2);
  EXPECT_EQ(parts[0], "a");
  EXPECT_EQ(parts[1], "d");
  parts.clear();

  string orig = "ab2342asdfv~~!";
  folly::split("", orig, parts, true);
  EXPECT_EQ(parts.size(), 1);
  EXPECT_EQ(parts[0], orig);
  parts.clear();

  folly::split("452x;o38asfsajsdlfdf.j", "asfds", parts, true);
  EXPECT_EQ(parts.size(), 1);
  EXPECT_EQ(parts[0], "asfds");
  parts.clear();

  folly::split("a", "", parts, true);
  EXPECT_EQ(parts.size(), 0);
  parts.clear();

  folly::split("a", "", parts);
  EXPECT_EQ(parts.size(), 1);
  EXPECT_EQ(parts[0], "");
  parts.clear();

  folly::split("a", StringPiece(), parts, true);
  EXPECT_EQ(parts.size(), 0);
  parts.clear();

  folly::split("a", StringPiece(), parts);
  EXPECT_EQ(parts.size(), 1);
  EXPECT_EQ(parts[0], "");
  parts.clear();

  folly::split("a", "abcdefg", parts, true);
  EXPECT_EQ(parts.size(), 1);
  EXPECT_EQ(parts[0], "bcdefg");
  parts.clear();

  orig = "All, , your base, are , , belong to us";
  folly::split(", ", orig, parts, true);
  EXPECT_EQ(parts.size(), 4);
  EXPECT_EQ(parts[0], "All");
  EXPECT_EQ(parts[1], "your base");
  EXPECT_EQ(parts[2], "are ");
  EXPECT_EQ(parts[3], "belong to us");
  parts.clear();
  folly::split(", ", orig, parts);
  EXPECT_EQ(parts.size(), 6);
  EXPECT_EQ(parts[0], "All");
  EXPECT_EQ(parts[1], "");
  EXPECT_EQ(parts[2], "your base");
  EXPECT_EQ(parts[3], "are ");
  EXPECT_EQ(parts[4], "");
  EXPECT_EQ(parts[5], "belong to us");
  parts.clear();

  orig = ", Facebook, rul,es!, ";
  folly::split(", ", orig, parts, true);
  EXPECT_EQ(parts.size(), 2);
  EXPECT_EQ(parts[0], "Facebook");
  EXPECT_EQ(parts[1], "rul,es!");
  parts.clear();
  folly::split(", ", orig, parts);
  EXPECT_EQ(parts.size(), 4);
  EXPECT_EQ(parts[0], "");
  EXPECT_EQ(parts[1], "Facebook");
  EXPECT_EQ(parts[2], "rul,es!");
  EXPECT_EQ(parts[3], "");
}

template <template <class, class> class VectorType>
void piecesTest() {
  VectorType<StringPiece, std::allocator<StringPiece>> pieces;
  VectorType<StringPiece, std::allocator<StringPiece>> pieces2;

  folly::split(',', "a,b,c", pieces);
  EXPECT_EQ(pieces.size(), 3);
  EXPECT_EQ(pieces[0], "a");
  EXPECT_EQ(pieces[1], "b");
  EXPECT_EQ(pieces[2], "c");

  pieces.clear();

  folly::split(',', "a,,c", pieces);
  EXPECT_EQ(pieces.size(), 3);
  EXPECT_EQ(pieces[0], "a");
  EXPECT_EQ(pieces[1], "");
  EXPECT_EQ(pieces[2], "c");
  pieces.clear();

  folly::split(',', "a,,c", pieces, true);
  EXPECT_EQ(pieces.size(), 2);
  EXPECT_EQ(pieces[0], "a");
  EXPECT_EQ(pieces[1], "c");
  pieces.clear();

  folly::split(',', ",,a,,c,,,", pieces, true);
  EXPECT_EQ(pieces.size(), 2);
  EXPECT_EQ(pieces[0], "a");
  EXPECT_EQ(pieces[1], "c");
  pieces.clear();

  // test multiple split w/o clear
  folly::split(',', ",,a,,c,,,", pieces, true);
  EXPECT_EQ(pieces.size(), 2);
  EXPECT_EQ(pieces[0], "a");
  EXPECT_EQ(pieces[1], "c");
  folly::split(',', ",,a,,c,,,", pieces, true);
  EXPECT_EQ(pieces.size(), 4);
  EXPECT_EQ(pieces[2], "a");
  EXPECT_EQ(pieces[3], "c");
  pieces.clear();

  // test multiple split rounds
  folly::split(",", "a_b,c_d", pieces);
  EXPECT_EQ(pieces.size(), 2);
  EXPECT_EQ(pieces[0], "a_b");
  EXPECT_EQ(pieces[1], "c_d");
  folly::split("_", pieces[0], pieces2);
  EXPECT_EQ(pieces2.size(), 2);
  EXPECT_EQ(pieces2[0], "a");
  EXPECT_EQ(pieces2[1], "b");
  pieces2.clear();
  folly::split("_", pieces[1], pieces2);
  EXPECT_EQ(pieces2.size(), 2);
  EXPECT_EQ(pieces2[0], "c");
  EXPECT_EQ(pieces2[1], "d");
  pieces.clear();
  pieces2.clear();

  // test splits that with multi-line delimiter
  folly::split("ab", "dabcabkdbkab", pieces, true);
  EXPECT_EQ(pieces.size(), 3);
  EXPECT_EQ(pieces[0], "d");
  EXPECT_EQ(pieces[1], "c");
  EXPECT_EQ(pieces[2], "kdbk");
  pieces.clear();

  string orig = "ab2342asdfv~~!";
  folly::split("", orig.c_str(), pieces, true);
  EXPECT_EQ(pieces.size(), 1);
  EXPECT_EQ(pieces[0], orig);
  pieces.clear();

  folly::split("452x;o38asfsajsdlfdf.j", "asfds", pieces, true);
  EXPECT_EQ(pieces.size(), 1);
  EXPECT_EQ(pieces[0], "asfds");
  pieces.clear();

  folly::split("a", "", pieces, true);
  EXPECT_EQ(pieces.size(), 0);
  pieces.clear();

  folly::split("a", "", pieces);
  EXPECT_EQ(pieces.size(), 1);
  EXPECT_EQ(pieces[0], "");
  pieces.clear();

  folly::split("a", "abcdefg", pieces, true);
  EXPECT_EQ(pieces.size(), 1);
  EXPECT_EQ(pieces[0], "bcdefg");
  pieces.clear();

  orig = "All, , your base, are , , belong to us";
  folly::split(", ", orig, pieces, true);
  EXPECT_EQ(pieces.size(), 4);
  EXPECT_EQ(pieces[0], "All");
  EXPECT_EQ(pieces[1], "your base");
  EXPECT_EQ(pieces[2], "are ");
  EXPECT_EQ(pieces[3], "belong to us");
  pieces.clear();
  folly::split(", ", orig, pieces);
  EXPECT_EQ(pieces.size(), 6);
  EXPECT_EQ(pieces[0], "All");
  EXPECT_EQ(pieces[1], "");
  EXPECT_EQ(pieces[2], "your base");
  EXPECT_EQ(pieces[3], "are ");
  EXPECT_EQ(pieces[4], "");
  EXPECT_EQ(pieces[5], "belong to us");
  pieces.clear();

  orig = ", Facebook, rul,es!, ";
  folly::split(", ", orig, pieces, true);
  EXPECT_EQ(pieces.size(), 2);
  EXPECT_EQ(pieces[0], "Facebook");
  EXPECT_EQ(pieces[1], "rul,es!");
  pieces.clear();
  folly::split(", ", orig, pieces);
  EXPECT_EQ(pieces.size(), 4);
  EXPECT_EQ(pieces[0], "");
  EXPECT_EQ(pieces[1], "Facebook");
  EXPECT_EQ(pieces[2], "rul,es!");
  EXPECT_EQ(pieces[3], "");
  pieces.clear();

  const char* str = "a,b";
  folly::split(',', StringPiece(str), pieces);
  EXPECT_EQ(pieces.size(), 2);
  EXPECT_EQ(pieces[0], "a");
  EXPECT_EQ(pieces[1], "b");
  EXPECT_EQ(pieces[0].start(), str);
  EXPECT_EQ(pieces[1].start(), str + 2);

  std::set<StringPiece> unique;
  folly::splitTo<StringPiece>(
      ":",
      "asd:bsd:asd:asd:bsd:csd::asd",
      std::inserter(unique, unique.begin()),
      true);
  EXPECT_EQ(unique.size(), 3);
  if (unique.size() == 3) {
    EXPECT_EQ(*unique.begin(), "asd");
    EXPECT_EQ(*--unique.end(), "csd");
  }

  VectorType<fbstring, std::allocator<fbstring>> blah;
  folly::split('-', "a-b-c-d-f-e", blah);
  EXPECT_EQ(blah.size(), 6);
}

} // namespace

TEST(Split, split_vector) {
  splitTest<std::vector>();
}
TEST(Split, split_fbvector) {
  splitTest<folly::fbvector>();
}
TEST(Split, pieces_vector) {
  piecesTest<std::vector>();
}
TEST(Split, pieces_fbvector) {
  piecesTest<folly::fbvector>();
}

TEST(Split, fixed) {
  StringPiece a, b, c, d;

  EXPECT_TRUE(folly::split<false>('.', "a.b.c.d", a, b, c, d));
  EXPECT_TRUE(folly::split<false>('.', "a.b.c", a, b, c));
  EXPECT_TRUE(folly::split<false>('.', "a.b", a, b));
  EXPECT_TRUE(folly::split<false>('.', "a", a));

  EXPECT_TRUE(folly::split('.', "a.b.c.d", a, b, c, d));
  EXPECT_TRUE(folly::split('.', "a.b.c", a, b, c));
  EXPECT_TRUE(folly::split('.', "a.b", a, b));
  EXPECT_TRUE(folly::split('.', "a", a));

  EXPECT_TRUE(folly::split<false>('.', "a.b.c", a, b, c));
  EXPECT_EQ("a", a);
  EXPECT_EQ("b", b);
  EXPECT_EQ("c", c);
  EXPECT_FALSE(folly::split<false>('.', "a.b", a, b, c));
  EXPECT_TRUE(folly::split<false>('.', "a.b.c", a, b));
  EXPECT_EQ("a", a);
  EXPECT_EQ("b.c", b);

  EXPECT_TRUE(folly::split('.', "a.b.c", a, b, c));
  EXPECT_EQ("a", a);
  EXPECT_EQ("b", b);
  EXPECT_EQ("c", c);
  EXPECT_FALSE(folly::split('.', "a.b.c", a, b));
  EXPECT_FALSE(folly::split('.', "a.b", a, b, c));

  EXPECT_TRUE(folly::split<false>('.', "a.b", a, b));
  EXPECT_EQ("a", a);
  EXPECT_EQ("b", b);
  EXPECT_FALSE(folly::split<false>('.', "a", a, b));
  EXPECT_TRUE(folly::split<false>('.', "a.b", a));
  EXPECT_EQ("a.b", a);

  EXPECT_TRUE(folly::split('.', "a.b", a, b));
  EXPECT_EQ("a", a);
  EXPECT_EQ("b", b);
  EXPECT_FALSE(folly::split('.', "a", a, b));
  EXPECT_FALSE(folly::split('.', "a.b", a));
}

TEST(Split, std_string_fixed) {
  std::string a, b, c, d;

  EXPECT_TRUE(folly::split<false>('.', "a.b.c.d", a, b, c, d));
  EXPECT_TRUE(folly::split<false>('.', "a.b.c", a, b, c));
  EXPECT_TRUE(folly::split<false>('.', "a.b", a, b));
  EXPECT_TRUE(folly::split<false>('.', "a", a));

  EXPECT_TRUE(folly::split('.', "a.b.c.d", a, b, c, d));
  EXPECT_TRUE(folly::split('.', "a.b.c", a, b, c));
  EXPECT_TRUE(folly::split('.', "a.b", a, b));
  EXPECT_TRUE(folly::split('.', "a", a));

  EXPECT_TRUE(folly::split<false>('.', "a.b.c", a, b, c));
  EXPECT_EQ("a", a);
  EXPECT_EQ("b", b);
  EXPECT_EQ("c", c);
  EXPECT_FALSE(folly::split<false>('.', "a.b", a, b, c));
  EXPECT_TRUE(folly::split<false>('.', "a.b.c", a, b));
  EXPECT_EQ("a", a);
  EXPECT_EQ("b.c", b);

  EXPECT_TRUE(folly::split('.', "a.b.c", a, b, c));
  EXPECT_EQ("a", a);
  EXPECT_EQ("b", b);
  EXPECT_EQ("c", c);
  EXPECT_FALSE(folly::split('.', "a.b.c", a, b));
  EXPECT_FALSE(folly::split('.', "a.b", a, b, c));

  EXPECT_TRUE(folly::split<false>('.', "a.b", a, b));
  EXPECT_EQ("a", a);
  EXPECT_EQ("b", b);
  EXPECT_FALSE(folly::split<false>('.', "a", a, b));
  EXPECT_TRUE(folly::split<false>('.', "a.b", a));
  EXPECT_EQ("a.b", a);

  EXPECT_TRUE(folly::split('.', "a.b", a, b));
  EXPECT_EQ("a", a);
  EXPECT_EQ("b", b);
  EXPECT_FALSE(folly::split('.', "a", a, b));
  EXPECT_FALSE(folly::split('.', "a.b", a));
}

TEST(Split, fixed_convert) {
  StringPiece a, d;
  int b;
  double c = 0;

  EXPECT_TRUE(folly::split(':', "a:13:14.7:b", a, b, c, d));
  EXPECT_EQ("a", a);
  EXPECT_EQ(13, b);
  EXPECT_NEAR(14.7, c, 1e-10);
  EXPECT_EQ("b", d);

  EXPECT_TRUE(folly::split<false>(':', "b:14:15.3:c", a, b, c, d));
  EXPECT_EQ("b", a);
  EXPECT_EQ(14, b);
  EXPECT_NEAR(15.3, c, 1e-10);
  EXPECT_EQ("c", d);

  EXPECT_FALSE(folly::split(':', "a:13:14.7:b", a, b, d));

  EXPECT_TRUE(folly::split<false>(':', "a:13:14.7:b", a, b, d));
  EXPECT_EQ("a", a);
  EXPECT_EQ(13, b);
  EXPECT_EQ("14.7:b", d);

  // Enable verifying that a line only contains one field
  EXPECT_TRUE(folly::split(' ', "hello", a));
  EXPECT_FALSE(folly::split(' ', "hello world", a));

  // Test cases with std::ignore.
  EXPECT_TRUE(folly::split(':', "a:13:14.7:b", std::ignore, b, c, d));
  EXPECT_EQ(13, b);
  EXPECT_NEAR(14.7, c, 1e-10);
  EXPECT_EQ("b", d);

  EXPECT_TRUE(folly::split(':', "a:13:14.7:b", std::ignore, b, c, std::ignore));
  EXPECT_EQ(13, b);
  EXPECT_NEAR(14.7, c, 1e-10);

  EXPECT_TRUE(folly::split<false>(':', "a:13:14.7:b", a, b, std::ignore));
  EXPECT_EQ("a", a);
  EXPECT_EQ(13, b);
}

namespace my {

enum class Color {
  Red,
  Blue,
};

enum class ColorErrorCode { INVALID_COLOR };

struct ColorError : std::runtime_error {
  using std::runtime_error::runtime_error;
};

ColorError makeConversionError(ColorErrorCode, StringPiece sp) {
  return ColorError("Invalid my::Color representation : " + sp.str());
}

Expected<StringPiece, ColorErrorCode> parseTo(
    StringPiece in,
    Color& out) noexcept {
  if (in == "R") {
    out = Color::Red;
  } else if (in == "B") {
    out = Color::Blue;
  } else {
    return makeUnexpected(ColorErrorCode::INVALID_COLOR);
  }
  return StringPiece(in.end(), in.end());
}
} // namespace my

TEST(Split, fixed_convert_custom) {
  my::Color c1, c2;

  EXPECT_TRUE(folly::split(',', "R,B", c1, c2));
  EXPECT_EQ(c1, my::Color::Red);
  EXPECT_EQ(c2, my::Color::Blue);

  EXPECT_THROW(folly::split(',', "B,G", c1, c2), my::ColorError);
}

TEST(String, join) {
  string output;

  std::vector<int> empty = {};
  join(":", empty, output);
  EXPECT_TRUE(output.empty());

  std::vector<std::string> input1 = {"1", "23", "456", ""};
  join(':', input1, output);
  EXPECT_EQ(output, "1:23:456:");
  output = join(':', input1);
  EXPECT_EQ(output, "1:23:456:");

  auto input2 = {1, 23, 456};
  join("-*-", input2, output);
  EXPECT_EQ(output, "1-*-23-*-456");
  output = join("-*-", input2);
  EXPECT_EQ(output, "1-*-23-*-456");

  auto input3 = {'f', 'a', 'c', 'e', 'b', 'o', 'o', 'k'};
  join("", input3, output);
  EXPECT_EQ(output, "facebook");

  join("_", {"", "f", "a", "c", "e", "b", "o", "o", "k", ""}, output);
  EXPECT_EQ(output, "_f_a_c_e_b_o_o_k_");

  output = join("", input3.begin(), input3.end());
  EXPECT_EQ(output, "facebook");

  std::multiset<char> input4(input3);
  output = join("", input4);
  EXPECT_EQ("abcefkoo", output);
  output = join("", input4.begin(), input4.end());
  EXPECT_EQ("abcefkoo", output);
}

TEST(String, hexlify) {
  string input1 = "0123";
  string output1;
  EXPECT_TRUE(hexlify(input1, output1));
  EXPECT_EQ("30313233", output1);

  fbstring input2 = "abcdefg";
  input2[1] = 0;
  input2[3] = 0xff;
  input2[5] = 0xb6;
  fbstring output2;
  EXPECT_TRUE(hexlify(input2, output2));
  EXPECT_EQ("610063ff65b667", output2);

  EXPECT_EQ("666f6f626172", hexlify("foobar"));
  auto bytes = folly::make_array<uint8_t>(1, 2, 3, 4);
  EXPECT_EQ("01020304", hexlify(ByteRange{bytes.data(), bytes.size()}));
}

TEST(String, unhexlify) {
  string input1 = "30313233";
  string output1;
  EXPECT_TRUE(unhexlify(input1, output1));
  EXPECT_EQ(output1, "0123");

  fbstring input2 = "610063ff65b667";
  fbstring output2;
  EXPECT_TRUE(unhexlify(input2, output2));
  EXPECT_EQ(output2.size(), 7);
  EXPECT_EQ(output2[0], 'a');
  EXPECT_EQ(output2[1], 0);
  EXPECT_EQ(output2[2], 'c');
  EXPECT_EQ(output2[3] & 0xff, 0xff);
  EXPECT_EQ(output2[4], 'e');
  EXPECT_EQ(output2[5] & 0xff, 0xb6);
  EXPECT_EQ(output2[6], 'g');

  string input3 = "x";
  string output3;
  EXPECT_FALSE(unhexlify(input3, output3));

  string input4 = "xy";
  string output4;
  EXPECT_FALSE(unhexlify(input4, output4));

  EXPECT_EQ("foobar", unhexlify("666f6f626172"));
  EXPECT_EQ(StringPiece("foo\0bar", 7), unhexlify("666f6f00626172"));
  EXPECT_THROW(unhexlify("666f6fzz626172"), std::domain_error);
}

TEST(String, backslashify) {
  EXPECT_EQ("abc", string("abc"));
  EXPECT_EQ("abc", backslashify(string("abc")));
  EXPECT_EQ("abc\\r", backslashify(string("abc\r")));
  EXPECT_EQ("abc\\x0d", backslashify(string("abc\r"), true));
  EXPECT_EQ("\\0\\0", backslashify(string(2, '\0')));

  StringPiece input1 = "abc\r";
  std::string output1 = backslashify(input1);
  EXPECT_EQ("abc\\r", output1);
}

TEST(String, humanify) {
  // Simple cases; output is obvious.
  EXPECT_EQ("abc", humanify(string("abc")));
  EXPECT_EQ("abc\\\\r", humanify(string("abc\\r")));
  EXPECT_EQ("0xff", humanify(string("\xff")));
  EXPECT_EQ("abc\\xff", humanify(string("abc\xff")));
  EXPECT_EQ("abc\\b", humanify(string("abc\b")));
  EXPECT_EQ("0x00", humanify(string(1, '\0')));
  EXPECT_EQ("0x0000", humanify(string(2, '\0')));

  // Mostly printable, so backslash!  80, 60, and 40% printable, respectively
  EXPECT_EQ("aaaa\\xff", humanify(string("aaaa\xff")));
  EXPECT_EQ("aaa\\xff\\xff", humanify(string("aaa\xff\xff")));
  EXPECT_EQ("aa\\xff\\xff\\xff", humanify(string("aa\xff\xff\xff")));

  // 20% printable, and the printable portion isn't the prefix; hexify!
  EXPECT_EQ(
      "0xff61ffffff",
      humanify(string("\xff"
                      "a\xff\xff\xff")));

  // Same as previous, except swap first two chars; prefix is
  // printable and within the threshold, so backslashify.
  EXPECT_EQ("a\\xff\\xff\\xff\\xff", humanify(string("a\xff\xff\xff\xff")));

  // Just too much unprintable; hex, despite prefix.
  EXPECT_EQ("0x61ffffffffff", humanify(string("a\xff\xff\xff\xff\xff")));
}

namespace {

/**
 * Copy bytes from src to somewhere in the buffer referenced by dst. The
 * actual starting position of the copy will be the first address in the
 * destination buffer whose address mod 8 is equal to the src address mod 8.
 * The caller is responsible for ensuring that the destination buffer has
 * enough extra space to accommodate the shifted copy.
 */
char* copyWithSameAlignment(char* dst, const char* src, size_t length) {
  const char* originalDst = dst;
  size_t dstOffset = size_t(dst) & 0x7;
  size_t srcOffset = size_t(src) & 0x7;
  while (dstOffset != srcOffset) {
    dst++;
    dstOffset++;
    dstOffset &= 0x7;
  }
  CHECK(dst <= originalDst + 7);
  CHECK((size_t(dst) & 0x7) == (size_t(src) & 0x7));
  memcpy(dst, src, length);
  return dst;
}

void testToLowerAscii(Range<const char*> src) {
  // Allocate extra space so we can make copies that start at the
  // same alignment (byte, word, quadword, etc) as the source buffer.
  auto controlBuf = std::vector<char>(src.size() + 7);
  char* control =
      copyWithSameAlignment(controlBuf.data(), src.begin(), src.size());

  auto testBuf = std::vector<char>(src.size() + 7);
  char* test = copyWithSameAlignment(testBuf.data(), src.begin(), src.size());

  for (size_t i = 0; i < src.size(); i++) {
    control[i] = tolower(control[i]);
  }
  toLowerAscii(test, src.size());
  for (size_t i = 0; i < src.size(); i++) {
    EXPECT_EQ(control[i], test[i]);
  }
}

} // namespace

TEST(String, toLowerAsciiAligned) {
  static const size_t kSize = 256;
  char input[kSize];
  for (size_t i = 0; i < kSize; i++) {
    input[i] = (char)(i & 0xff);
  }
  testToLowerAscii(Range<const char*>(input, kSize));
}

TEST(String, toLowerAsciiUnaligned) {
  static const size_t kSize = 256;
  char input[kSize];
  for (size_t i = 0; i < kSize; i++) {
    input[i] = (char)(i & 0xff);
  }
  // Test input buffers of several lengths to exercise all the
  // cases: buffer at the start/middle/end of an aligned block, plus
  // buffers that span multiple aligned blocks.  The longest test input
  // is 3 unaligned bytes + 4 32-bit aligned bytes + 8 64-bit aligned
  // + 4 32-bit aligned + 3 unaligned = 22 bytes.
  for (size_t length = 1; length < 23; length++) {
    for (size_t offset = 0; offset + length <= kSize; offset++) {
      testToLowerAscii(Range<const char*>(input + offset, length));
    }
  }
}

TEST(String, whitespace) {
  // trimWhitespace:
  EXPECT_EQ("kavabanga", trimWhitespace("kavabanga"));
  EXPECT_EQ("kavabanga", trimWhitespace("kavabanga \t \n  "));
  EXPECT_EQ("kavabanga", trimWhitespace("   \t \r \n \n kavabanga"));
  EXPECT_EQ("kavabanga", trimWhitespace("\t \r \n   kavabanga \t \n  "));
  EXPECT_EQ("kavabanga", trimWhitespace("   \t \r \n \n kavabanga"));
  EXPECT_EQ("kavabanga", trimWhitespace("\t \r \n   kavabanga \t \n  "));
  EXPECT_EQ(
      ltrimWhitespace(rtrimWhitespace("kavabanga")),
      rtrimWhitespace(ltrimWhitespace("kavabanga")));
  EXPECT_EQ(
      ltrimWhitespace(rtrimWhitespace("kavabanga  \r\t\n")),
      rtrimWhitespace(ltrimWhitespace("kavabanga  \r\t\n")));
  EXPECT_EQ("", trimWhitespace("\t \r \n   \t \n  "));
  EXPECT_EQ("", trimWhitespace(""));
  EXPECT_EQ("", trimWhitespace("\t"));
  EXPECT_EQ("", trimWhitespace("\r"));
  EXPECT_EQ("", trimWhitespace("\n"));
  EXPECT_EQ("", trimWhitespace("\t "));
  EXPECT_EQ("", trimWhitespace("\r  "));
  EXPECT_EQ("", trimWhitespace("\n   "));
  EXPECT_EQ("", trimWhitespace("    \t"));
  EXPECT_EQ("", trimWhitespace("    \r"));
  EXPECT_EQ("", trimWhitespace("    \n"));

  // ltrimWhitespace:
  EXPECT_EQ("kavabanga", ltrimWhitespace("\t kavabanga"));
  EXPECT_EQ("kavabanga \r\n", ltrimWhitespace("\t kavabanga \r\n"));
  EXPECT_EQ("", ltrimWhitespace("\r "));
  EXPECT_EQ("", ltrimWhitespace("\n   "));
  EXPECT_EQ("", ltrimWhitespace("\r   "));

  // rtrimWhitespace:
  EXPECT_EQ("\t kavabanga", rtrimWhitespace("\t kavabanga"));
  EXPECT_EQ("\t kavabanga", rtrimWhitespace("\t kavabanga \r\n"));
  EXPECT_EQ("", rtrimWhitespace("\r "));
  EXPECT_EQ("", rtrimWhitespace("\n   "));
  EXPECT_EQ("", rtrimWhitespace("\r   "));
}

TEST(String, stripLeftMargin_really_empty) {
  auto input = "";
  auto expected = "";
  EXPECT_EQ(expected, stripLeftMargin(input));
}

TEST(String, stripLeftMargin_empty) {
  auto input = R"TEXT(
  )TEXT";
  auto expected = "";
  EXPECT_EQ(expected, stripLeftMargin(input));
}

TEST(String, stripLeftMargin_only_whitespace) {
  //  using ~ as a marker
  string input = R"TEXT(
    ~
  )TEXT";
  input = boost::regex_replace(input, boost::regex("~"), "");
  EXPECT_EQ("\n    \n  ", input);
  auto expected = "\n";
  EXPECT_EQ(expected, stripLeftMargin(input));
}

TEST(String, stripLeftMargin_only_uneven_whitespace) {
  //  using ~ as a marker1
  string input = R"TEXT(
    ~
      ~
  )TEXT";
  input = boost::regex_replace(input, boost::regex("~"), "");
  EXPECT_EQ("\n    \n      \n  ", input);
  auto expected = "\n\n";

  EXPECT_EQ(expected, stripLeftMargin(input));
}

TEST(String, stripLeftMargin_one_line) {
  auto input = R"TEXT(
    hi there bob!
  )TEXT";
  auto expected = "hi there bob!\n";
  EXPECT_EQ(expected, stripLeftMargin(input));
}

TEST(String, stripLeftMargin_two_lines) {
  auto input = R"TEXT(
    hi there bob!
    nice weather today!
  )TEXT";
  auto expected = "hi there bob!\nnice weather today!\n";
  EXPECT_EQ(expected, stripLeftMargin(input));
}

TEST(String, stripLeftMargin_three_lines_uneven) {
  auto input = R"TEXT(
      hi there bob!
    nice weather today!
      so long!
  )TEXT";
  auto expected = "  hi there bob!\nnice weather today!\n  so long!\n";
  EXPECT_EQ(expected, stripLeftMargin(input));
}

TEST(String, stripLeftMargin_preceding_blank_lines) {
  auto input = R"TEXT(


    hi there bob!
  )TEXT";
  auto expected = "\n\nhi there bob!\n";
  EXPECT_EQ(expected, stripLeftMargin(input));
}

TEST(String, stripLeftMargin_succeeding_blank_lines) {
  auto input = R"TEXT(
    hi there bob!


  )TEXT";
  auto expected = "hi there bob!\n\n\n";
  EXPECT_EQ(expected, stripLeftMargin(input));
}

TEST(String, stripLeftMargin_interstitial_undented_whiteline) {
  //  using ~ as a marker
  string input = R"TEXT(
      hi there bob!
    ~
      so long!
  )TEXT";
  input = boost::regex_replace(input, boost::regex(" +~"), "");
  EXPECT_EQ("\n      hi there bob!\n\n      so long!\n  ", input);
  auto expected = "hi there bob!\n\nso long!\n";
  EXPECT_EQ(expected, stripLeftMargin(input));
}

TEST(String, stripLeftMargin_interstitial_dedented_whiteline) {
  //  using ~ as a marker
  string input = R"TEXT(
      hi there bob!
    ~
      so long!
  )TEXT";
  input = boost::regex_replace(input, boost::regex("~"), "");
  EXPECT_EQ("\n      hi there bob!\n    \n      so long!\n  ", input);
  auto expected = "hi there bob!\n\nso long!\n";
  EXPECT_EQ(expected, stripLeftMargin(input));
}

TEST(String, stripLeftMargin_interstitial_equidented_whiteline) {
  //  using ~ as a marker
  string input = R"TEXT(
      hi there bob!
      ~
      so long!
  )TEXT";
  input = boost::regex_replace(input, boost::regex("~"), "");
  EXPECT_EQ("\n      hi there bob!\n      \n      so long!\n  ", input);
  auto expected = "hi there bob!\n\nso long!\n";
  EXPECT_EQ(expected, stripLeftMargin(input));
}

TEST(String, stripLeftMargin_interstitial_indented_whiteline) {
  //  using ~ as a marker
  string input = R"TEXT(
      hi there bob!
        ~
      so long!
  )TEXT";
  input = boost::regex_replace(input, boost::regex("~"), "");
  EXPECT_EQ("\n      hi there bob!\n        \n      so long!\n  ", input);
  auto expected = "hi there bob!\n  \nso long!\n";
  EXPECT_EQ(expected, stripLeftMargin(input));
}

TEST(String, stripLeftMargin_no_pre_whitespace) {
  //  using ~ as a marker
  string input = R"TEXT(      hi there bob!
        ~
      so long!
  )TEXT";
  input = boost::regex_replace(input, boost::regex("~"), "");
  EXPECT_EQ("      hi there bob!\n        \n      so long!\n  ", input);
  auto expected = "hi there bob!\n  \nso long!\n";
  EXPECT_EQ(expected, stripLeftMargin(input));
}

TEST(String, stripLeftMargin_no_post_whitespace) {
  //  using ~ as a marker
  string input = R"TEXT(
      hi there bob!
        ~
      so long!  )TEXT";
  input = boost::regex_replace(input, boost::regex("~"), "");
  EXPECT_EQ("\n      hi there bob!\n        \n      so long!  ", input);
  auto expected = "hi there bob!\n  \nso long!  ";
  EXPECT_EQ(expected, stripLeftMargin(input));
}
