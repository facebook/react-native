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

#include <folly/Range.h>

#include <algorithm>
#include <iostream>
#include <random>
#include <string>

#include <folly/Benchmark.h>
#include <folly/container/Foreach.h>

using namespace folly;
using namespace std;

namespace {

std::string str;
constexpr int kVstrSize = 16;
std::vector<std::string> vstr;
std::vector<StringPiece> vstrp;
std::string file;

void initStr(int len) {
  str.clear();
  vstr.clear();
  vstrp.clear();

  str.reserve(len + 1);
  str.append(len, 'a');
  str.append(1, 'b');

  // create 16 copies of str, each with a different 16byte alignment.
  // Useful because some implementations of find_first_of have different
  // behaviors based on byte alignment.
  for (int i = 0; i < kVstrSize; ++i) {
    string s(i, '$');
    s += str;
    if (i % 2) {
      // some find_first_of implementations have special (page-safe) logic
      // for handling the end of a string.  Flex that logic only sometimes.
      s += string(32, '$');
    }
    vstr.push_back(s);
    StringPiece sp(vstr.back());
    sp.advance(i);
    vstrp.push_back(sp);
  }
}

std::mt19937 rnd;
string ffoTestString;
const size_t ffoDelimSize = 128;
vector<string> ffoDelim;

void initFile(int len) {
  std::uniform_int_distribution<uint32_t> validChar(1, 64);
  file.clear();
  while (len--) {
    char ch = validChar(rnd);
    if (ch == '\r') {
      ch = '\n';
    }
    file.push_back(ch);
  }
}

string generateString(int len) {
  std::uniform_int_distribution<uint32_t> validChar(1, 255); // no null-char
  string ret;
  while (len--) {
    ret.push_back(validChar(rnd));
  }
  return ret;
}

void initDelims(int len) {
  ffoDelim.clear();

  string s(len - 1, '\0'); // find_first_of won't finish until last char
  s.push_back('a');
  ffoTestString = s;

  for (size_t i = 0; i < ffoDelimSize; ++i) {
    // most delimiter sets are pretty small, but occasionally there could
    // be a big one.
    auto n = rnd() % 8 + 1;
    if (n == 8) {
      n = 32;
    }
    auto s_ = generateString(n);
    if (rnd() % 2) {
      // ~half of tests will find a hit
      s_[rnd() % s_.size()] = 'a'; // yes, this could mean 'a' is a duplicate
    }
    ffoDelim.push_back(s_);
  }
}

} // namespace

BENCHMARK(FindSingleCharMemchr, n) {
  StringPiece haystack(str);
  FOR_EACH_RANGE (i, 0, n) {
    doNotOptimizeAway(haystack.find('b'));
    char x = haystack[0];
    doNotOptimizeAway(&x);
  }
}

BENCHMARK_RELATIVE(FindSingleCharRange, n) {
  const char c = 'b';
  StringPiece haystack(str);
  folly::StringPiece needle(&c, &c + 1);
  FOR_EACH_RANGE (i, 0, n) {
    doNotOptimizeAway(haystack.find(needle));
    char x = haystack[0];
    doNotOptimizeAway(&x);
  }
}

BENCHMARK_DRAW_LINE();

template <class Func>
void countHits(Func func, size_t n) {
  StringPiece needles = "\r\n\1";
  FOR_EACH_RANGE (i, 0, n) {
    size_t p, c = 0;
    for (StringPiece left = file;
         (p = func(left, needles)) != StringPiece::npos;
         left.advance(p + 1)) {
      ++c;
    }
    doNotOptimizeAway(c);
  }
}

template <class Func>
void findFirstOfRange(StringPiece needles, Func func, size_t n) {
  FOR_EACH_RANGE (i, 0, n) {
    const StringPiece haystack = vstrp[i % kVstrSize];
    doNotOptimizeAway(func(haystack, needles));
    char x = haystack[0];
    doNotOptimizeAway(&x);
  }
}

const string delims1 = "b";

BENCHMARK(FindFirstOf1NeedlesBase, n) {
  findFirstOfRange(delims1, detail::qfind_first_byte_of, n);
}

BENCHMARK_RELATIVE(FindFirstOf1NeedlesNoSSE, n) {
  findFirstOfRange(delims1, detail::qfind_first_byte_of_nosse, n);
}

BENCHMARK_RELATIVE(FindFirstOf1NeedlesStd, n) {
  findFirstOfRange(delims1, detail::qfind_first_byte_of_std, n);
}

BENCHMARK_RELATIVE(FindFirstOf1NeedlesByteSet, n) {
  findFirstOfRange(delims1, detail::qfind_first_byte_of_byteset, n);
}

BENCHMARK_RELATIVE(FindFirstOf1NeedlesBitSet, n) {
  findFirstOfRange(delims1, detail::qfind_first_byte_of_bitset, n);
}

BENCHMARK_DRAW_LINE();

const string delims2 = "bc";

BENCHMARK(FindFirstOf2NeedlesBase, n) {
  findFirstOfRange(delims2, detail::qfind_first_byte_of, n);
}

BENCHMARK_RELATIVE(FindFirstOf2NeedlesNoSSE, n) {
  findFirstOfRange(delims2, detail::qfind_first_byte_of_nosse, n);
}

BENCHMARK_RELATIVE(FindFirstOf2NeedlesStd, n) {
  findFirstOfRange(delims2, detail::qfind_first_byte_of_std, n);
}

BENCHMARK_RELATIVE(FindFirstOf2NeedlesByteSet, n) {
  findFirstOfRange(delims2, detail::qfind_first_byte_of_byteset, n);
}

BENCHMARK_RELATIVE(FindFirstOf2NeedlesBitSet, n) {
  findFirstOfRange(delims2, detail::qfind_first_byte_of_bitset, n);
}

BENCHMARK_DRAW_LINE();

const string delims4 = "bcde";

BENCHMARK(FindFirstOf4NeedlesBase, n) {
  findFirstOfRange(delims4, detail::qfind_first_byte_of, n);
}

BENCHMARK_RELATIVE(FindFirstOf4NeedlesNoSSE, n) {
  findFirstOfRange(delims4, detail::qfind_first_byte_of_nosse, n);
}

BENCHMARK_RELATIVE(FindFirstOf4NeedlesStd, n) {
  findFirstOfRange(delims4, detail::qfind_first_byte_of_std, n);
}

BENCHMARK_RELATIVE(FindFirstOf4NeedlesByteSet, n) {
  findFirstOfRange(delims4, detail::qfind_first_byte_of_byteset, n);
}

BENCHMARK_RELATIVE(FindFirstOf4NeedlesBitSet, n) {
  findFirstOfRange(delims4, detail::qfind_first_byte_of_bitset, n);
}

BENCHMARK_DRAW_LINE();

const string delims8 = "0123456b";

BENCHMARK(FindFirstOf8NeedlesBase, n) {
  findFirstOfRange(delims8, detail::qfind_first_byte_of, n);
}

BENCHMARK_RELATIVE(FindFirstOf8NeedlesNoSSE, n) {
  findFirstOfRange(delims8, detail::qfind_first_byte_of_nosse, n);
}

BENCHMARK_RELATIVE(FindFirstOf8NeedlesStd, n) {
  findFirstOfRange(delims8, detail::qfind_first_byte_of_std, n);
}

BENCHMARK_RELATIVE(FindFirstOf8NeedlesByteSet, n) {
  findFirstOfRange(delims8, detail::qfind_first_byte_of_byteset, n);
}

BENCHMARK_RELATIVE(FindFirstOf8NeedlesBitSet, n) {
  findFirstOfRange(delims8, detail::qfind_first_byte_of_bitset, n);
}

BENCHMARK_DRAW_LINE();

const string delims16 = "0123456789bcdefg";

BENCHMARK(FindFirstOf16NeedlesBase, n) {
  findFirstOfRange(delims16, detail::qfind_first_byte_of, n);
}

BENCHMARK_RELATIVE(FindFirstOf16NeedlesNoSSE, n) {
  findFirstOfRange(delims16, detail::qfind_first_byte_of_nosse, n);
}

BENCHMARK_RELATIVE(FindFirstOf16NeedlesStd, n) {
  findFirstOfRange(delims16, detail::qfind_first_byte_of_std, n);
}

BENCHMARK_RELATIVE(FindFirstOf16NeedlesByteSet, n) {
  findFirstOfRange(delims16, detail::qfind_first_byte_of_byteset, n);
}

BENCHMARK_RELATIVE(FindFirstOf16NeedlesBitSet, n) {
  findFirstOfRange(delims16, detail::qfind_first_byte_of_bitset, n);
}

BENCHMARK_DRAW_LINE();

const string delims32 = "!bcdefghijklmnopqrstuvwxyz_012345";

BENCHMARK(FindFirstOf32NeedlesBase, n) {
  findFirstOfRange(delims32, detail::qfind_first_byte_of, n);
}

BENCHMARK_RELATIVE(FindFirstOf32NeedlesNoSSE, n) {
  findFirstOfRange(delims32, detail::qfind_first_byte_of_nosse, n);
}

BENCHMARK_RELATIVE(FindFirstOf32NeedlesStd, n) {
  findFirstOfRange(delims32, detail::qfind_first_byte_of_std, n);
}

BENCHMARK_RELATIVE(FindFirstOf32NeedlesByteSet, n) {
  findFirstOfRange(delims32, detail::qfind_first_byte_of_byteset, n);
}

BENCHMARK_RELATIVE(FindFirstOf32NeedlesBitSet, n) {
  findFirstOfRange(delims32, detail::qfind_first_byte_of_bitset, n);
}

BENCHMARK_DRAW_LINE();

const string delims64 =
    "!bcdefghijklmnopqrstuvwxyz_"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ-0123456789$";

BENCHMARK(FindFirstOf64NeedlesBase, n) {
  findFirstOfRange(delims64, detail::qfind_first_byte_of, n);
}

BENCHMARK_RELATIVE(FindFirstOf64NeedlesNoSSE, n) {
  findFirstOfRange(delims64, detail::qfind_first_byte_of_nosse, n);
}

BENCHMARK_RELATIVE(FindFirstOf64NeedlesStd, n) {
  findFirstOfRange(delims64, detail::qfind_first_byte_of_std, n);
}

BENCHMARK_RELATIVE(FindFirstOf64NeedlesByteSet, n) {
  findFirstOfRange(delims64, detail::qfind_first_byte_of_byteset, n);
}

BENCHMARK_RELATIVE(FindFirstOf64NeedlesBitSet, n) {
  findFirstOfRange(delims64, detail::qfind_first_byte_of_bitset, n);
}

BENCHMARK_DRAW_LINE();

template <class Func>
void findFirstOfRandom(Func func, size_t iters) {
  for (size_t i = 0; i < iters; ++i) {
    auto test = i % ffoDelim.size();
    auto p = func(ffoTestString, ffoDelim[test]);
    doNotOptimizeAway(p);
  }
}

BENCHMARK(FindFirstOfRandomBase, n) {
  findFirstOfRandom(detail::qfind_first_byte_of, n);
}

BENCHMARK_RELATIVE(FindFirstOfRandomNoSSE, n) {
  findFirstOfRandom(detail::qfind_first_byte_of_nosse, n);
}

BENCHMARK_RELATIVE(FindFirstOfRandomStd, n) {
  findFirstOfRandom(detail::qfind_first_byte_of_std, n);
}

BENCHMARK_RELATIVE(FindFirstOfRandomByteSet, n) {
  findFirstOfRandom(detail::qfind_first_byte_of_byteset, n);
}

BENCHMARK_RELATIVE(FindFirstOfRandomBitSet, n) {
  findFirstOfRandom(detail::qfind_first_byte_of_bitset, n);
}

BENCHMARK_DRAW_LINE();

BENCHMARK(CountDelimsBase, n) {
  countHits(detail::qfind_first_byte_of, n);
}

BENCHMARK_RELATIVE(CountDelimsNoSSE, n) {
  countHits(detail::qfind_first_byte_of_nosse, n);
}

BENCHMARK_RELATIVE(CountDelimsStd, n) {
  countHits(detail::qfind_first_byte_of_std, n);
}

BENCHMARK_RELATIVE(CountDelimsByteSet, n) {
  countHits(detail::qfind_first_byte_of_byteset, n);
}

BENCHMARK_RELATIVE(CountDelimsBitSet, n) {
  countHits(detail::qfind_first_byte_of_bitset, n);
}

BENCHMARK_DRAW_LINE();

BENCHMARK(FindFirstOfOffsetRange, n) {
  StringPiece haystack(str);
  folly::StringPiece needles("bc");
  DCHECK_EQ(haystack.size() - 1, haystack.find_first_of(needles, 1)); // works!
  FOR_EACH_RANGE (i, 0, n) {
    size_t pos = i % 2; // not a constant to prevent optimization
    doNotOptimizeAway(haystack.find_first_of(needles, pos));
    char x = haystack[0];
    doNotOptimizeAway(&x);
  }
}

BENCHMARK_DRAW_LINE();

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);

  for (int len : {1, 8, 10, 16, 32, 64, 128, 256, 10 * 1024, 1024 * 1024}) {
    initStr(len);
    initDelims(len);
    initFile(len);
    runBenchmarks();
  }
  return 0;
}
