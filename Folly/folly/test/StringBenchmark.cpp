/*
 * Copyright 2017 Facebook, Inc.
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

#include <folly/String.h>

#include <boost/algorithm/string.hpp>
#include <folly/Benchmark.h>
#include <folly/Random.h>
#include <random>

using namespace folly;
using namespace std;

BENCHMARK(libc_tolower, iters) {
  static const size_t kSize = 256;
  // This array is static to keep the compiler from optimizing the
  // entire function down to a no-op if it has an inlined impl of
  // tolower and thus is able to tell that there are no side-effects.
  // No side-effects + no writes to anything other than local variables
  // + no return value = no need to run any of the code in the function.
  // gcc, for example, makes that optimization with -O2.
  static char input[kSize];
  for (size_t i = 0; i < kSize; i++) {
    input[i] = (char)(i & 0xff);
  }
  for (auto i = iters; i > 0; i--) {
    for (size_t offset = 0; offset < kSize; offset++) {
      input[offset] = tolower(input[offset]);
    }
  }
}

BENCHMARK(folly_toLowerAscii, iters) {
  static const size_t kSize = 256;
  static char input[kSize];
  for (size_t i = 0; i < kSize; i++) {
    input[i] = (char)(i & 0xff);
  }
  for (auto i = iters; i > 0; i--) {
    folly::toLowerAscii(input, kSize);
  }
}

// A simple benchmark that tests various output sizes for a simple
// input; the goal is to measure the output buffer resize code cost.
void stringPrintfOutputSize(int iters, int param) {
  string buffer;
  BENCHMARK_SUSPEND { buffer.resize(param, 'x'); }

  for (int64_t i = 0; i < iters; ++i) {
    string s = stringPrintf("msg: %d, %d, %s", 10, 20, buffer.c_str());
  }
}

// The first few of these tend to fit in the inline buffer, while the
// subsequent ones cross that limit, trigger a second vsnprintf, and
// exercise a different codepath.
BENCHMARK_PARAM(stringPrintfOutputSize, 1)
BENCHMARK_PARAM(stringPrintfOutputSize, 4)
BENCHMARK_PARAM(stringPrintfOutputSize, 16)
BENCHMARK_PARAM(stringPrintfOutputSize, 64)
BENCHMARK_PARAM(stringPrintfOutputSize, 256)
BENCHMARK_PARAM(stringPrintfOutputSize, 1024)

// Benchmark simple stringAppendf behavior to show a pathology Lovro
// reported (t5735468).
BENCHMARK(stringPrintfAppendfBenchmark, iters) {
  for (unsigned int i = 0; i < iters; ++i) {
    string s;
    BENCHMARK_SUSPEND { s.reserve(300000); }
    for (int j = 0; j < 300000; ++j) {
      stringAppendf(&s, "%d", 1);
    }
  }
}

namespace {
fbstring cbmString;
fbstring cbmEscapedString;
fbstring cEscapedString;
fbstring cUnescapedString;
const size_t kCBmStringLength = 64 << 10;
const uint32_t kCPrintablePercentage = 90;

fbstring uribmString;
fbstring uribmEscapedString;
fbstring uriEscapedString;
fbstring uriUnescapedString;
const size_t kURIBmStringLength = 256;
const uint32_t kURIPassThroughPercentage = 50;

fbstring hexlifyInput;
fbstring hexlifyOutput;
const size_t kHexlifyLength = 1024;

void initBenchmark() {
  std::mt19937 rnd;

  // C escape
  std::uniform_int_distribution<uint32_t> printable(32, 126);
  std::uniform_int_distribution<uint32_t> nonPrintable(0, 160);
  std::uniform_int_distribution<uint32_t> percentage(0, 99);

  cbmString.reserve(kCBmStringLength);
  for (size_t i = 0; i < kCBmStringLength; ++i) {
    unsigned char c;
    if (percentage(rnd) < kCPrintablePercentage) {
      c = printable(rnd);
    } else {
      c = nonPrintable(rnd);
      // Generate characters in both non-printable ranges:
      // 0..31 and 127..255
      if (c >= 32) {
        c += (126 - 32) + 1;
      }
    }
    cbmString.push_back(c);
  }

  cbmEscapedString = cEscape<fbstring>(cbmString);

  // URI escape
  std::uniform_int_distribution<uint32_t> passthrough('a', 'z');
  std::string encodeChars = " ?!\"',+[]";
  std::uniform_int_distribution<uint32_t> encode(0, encodeChars.size() - 1);

  uribmString.reserve(kURIBmStringLength);
  for (size_t i = 0; i < kURIBmStringLength; ++i) {
    unsigned char c;
    if (percentage(rnd) < kURIPassThroughPercentage) {
      c = passthrough(rnd);
    } else {
      c = encodeChars[encode(rnd)];
    }
    uribmString.push_back(c);
  }

  uribmEscapedString = uriEscape<fbstring>(uribmString);

  // hexlify
  hexlifyInput.resize(kHexlifyLength);
  Random::secureRandom(&hexlifyInput[0], kHexlifyLength);
  folly::hexlify(hexlifyInput, hexlifyOutput);
}

BENCHMARK(BM_cEscape, iters) {
  while (iters--) {
    cEscapedString = cEscape<fbstring>(cbmString);
    doNotOptimizeAway(cEscapedString.size());
  }
}

BENCHMARK(BM_cUnescape, iters) {
  while (iters--) {
    cUnescapedString = cUnescape<fbstring>(cbmEscapedString);
    doNotOptimizeAway(cUnescapedString.size());
  }
}

BENCHMARK(BM_uriEscape, iters) {
  while (iters--) {
    uriEscapedString = uriEscape<fbstring>(uribmString);
    doNotOptimizeAway(uriEscapedString.size());
  }
}

BENCHMARK(BM_uriUnescape, iters) {
  while (iters--) {
    uriUnescapedString = uriUnescape<fbstring>(uribmEscapedString);
    doNotOptimizeAway(uriUnescapedString.size());
  }
}

BENCHMARK(BM_unhexlify, iters) {
  // iters/sec = bytes output per sec
  std::string unhexed;
  folly::StringPiece hex = hexlifyOutput;
  for (; iters >= hex.size(); iters -= hex.size()) {
    folly::unhexlify(hex, unhexed);
  }
  iters -= iters % 2; // round down to an even number of chars
  hex = hex.subpiece(0, iters);
  folly::unhexlify(hex, unhexed);
}

} // namespace

//////////////////////////////////////////////////////////////////////

BENCHMARK(splitOnSingleChar, iters) {
  static const std::string line = "one:two:three:four";
  for (size_t i = 0; i < iters << 4; ++i) {
    std::vector<StringPiece> pieces;
    folly::split(':', line, pieces);
  }
}

BENCHMARK(splitOnSingleCharFixed, iters) {
  static const std::string line = "one:two:three:four";
  for (size_t i = 0; i < iters << 4; ++i) {
    StringPiece a, b, c, d;
    folly::split(':', line, a, b, c, d);
  }
}

BENCHMARK(splitOnSingleCharFixedAllowExtra, iters) {
  static const std::string line = "one:two:three:four";
  for (size_t i = 0; i < iters << 4; ++i) {
    StringPiece a, b, c, d;
    folly::split<false>(':', line, a, b, c, d);
  }
}

BENCHMARK(splitStr, iters) {
  static const std::string line = "one-*-two-*-three-*-four";
  for (size_t i = 0; i < iters << 4; ++i) {
    std::vector<StringPiece> pieces;
    folly::split("-*-", line, pieces);
  }
}

BENCHMARK(splitStrFixed, iters) {
  static const std::string line = "one-*-two-*-three-*-four";
  for (size_t i = 0; i < iters << 4; ++i) {
    StringPiece a, b, c, d;
    folly::split("-*-", line, a, b, c, d);
  }
}

BENCHMARK(boost_splitOnSingleChar, iters) {
  static const std::string line = "one:two:three:four";
  bool (*pred)(char) = [](char c) -> bool { return c == ':'; };
  for (size_t i = 0; i < iters << 4; ++i) {
    std::vector<boost::iterator_range<std::string::const_iterator>> pieces;
    boost::split(pieces, line, pred);
  }
}

BENCHMARK(joinCharStr, iters) {
  static const std::vector<std::string> input = {
      "one", "two", "three", "four", "five", "six", "seven"};
  for (size_t i = 0; i < iters << 4; ++i) {
    std::string output;
    folly::join(':', input, output);
  }
}

BENCHMARK(joinStrStr, iters) {
  static const std::vector<std::string> input = {
      "one", "two", "three", "four", "five", "six", "seven"};
  for (size_t i = 0; i < iters << 4; ++i) {
    std::string output;
    folly::join(":", input, output);
  }
}

BENCHMARK(joinInt, iters) {
  static const auto input = {123, 456, 78910, 1112, 1314, 151, 61718};
  for (size_t i = 0; i < iters << 4; ++i) {
    std::string output;
    folly::join(":", input, output);
  }
}

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  initBenchmark();
  folly::runBenchmarks();
  return 0;
}

/*
Results on x86_64:
============================================================================
folly/test/StringBenchmark.cpp                  relative  time/iter  iters/s
============================================================================
libc_tolower                                               773.30ns    1.29M
folly_toLowerAscii                                          65.04ns   15.38M
stringPrintfOutputSize(1)                                  224.67ns    4.45M
stringPrintfOutputSize(4)                                  231.53ns    4.32M
stringPrintfOutputSize(16)                                 286.54ns    3.49M
stringPrintfOutputSize(64)                                 305.47ns    3.27M
stringPrintfOutputSize(256)                                  1.48us  674.45K
stringPrintfOutputSize(1024)                                 5.89us  169.72K
stringPrintfAppendfBenchmark                                34.43ms    29.04
BM_cEscape                                                 461.51us    2.17K
BM_cUnescape                                               328.19us    3.05K
BM_uriEscape                                                 4.36us  229.25K
BM_uriUnescape                                               2.22us  450.64K
splitOnSingleChar                                            1.46us  687.21K
splitOnSingleCharFixed                                     133.02ns    7.52M
splitOnSingleCharFixedAllowExtra                            74.35ns   13.45M
splitStr                                                     2.36us  424.00K
splitStrFixed                                              282.38ns    3.54M
boost_splitOnSingleChar                                      2.83us  353.12K
joinCharStr                                                  2.65us  376.93K
joinStrStr                                                   2.64us  378.09K
joinInt                                                      3.89us  257.37K
============================================================================
*/
