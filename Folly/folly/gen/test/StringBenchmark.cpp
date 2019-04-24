/*
 * Copyright 2014-present Facebook, Inc.
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

#include <atomic>

#include <glog/logging.h>

#include <folly/Benchmark.h>
#include <folly/String.h>
#include <folly/container/Foreach.h>
#include <folly/gen/Base.h>
#include <folly/gen/String.h>

using namespace folly;
using namespace folly::gen;
using std::pair;
using std::set;
using std::tuple;
using std::vector;

namespace {

static std::atomic<int> testSize(1000);
static vector<fbstring> testStrVector =
    seq(1, testSize.load()) | eachTo<fbstring>() | as<vector>();
static auto testFileContent = from(testStrVector) | unsplit('\n');

const char* const kLine = "The quick brown fox jumped over the lazy dog.\n";
const size_t kLineCount = 10000;
std::string bigLines;
const size_t kSmallLineSize = 17;
std::vector<std::string> smallLines;

void initStringResplitterBenchmark() {
  bigLines.reserve(kLineCount * strlen(kLine));
  for (size_t i = 0; i < kLineCount; ++i) {
    bigLines += kLine;
  }
  size_t remaining = bigLines.size();
  size_t pos = 0;
  while (remaining) {
    size_t n = std::min(kSmallLineSize, remaining);
    smallLines.push_back(bigLines.substr(pos, n));
    pos += n;
    remaining -= n;
  }
}

size_t len(folly::StringPiece s) {
  return s.size();
}

} // namespace

BENCHMARK(StringResplitter_Big, iters) {
  size_t s = 0;
  while (iters--) {
    s += from({bigLines}) | resplit('\n') | map(&len) | sum;
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_RELATIVE(StringResplitter_Small, iters) {
  size_t s = 0;
  while (iters--) {
    s += from(smallLines) | resplit('\n') | map(&len) | sum;
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_DRAW_LINE();

BENCHMARK(StringSplit_Old, iters) {
  size_t s = 0;
  std::string line(kLine);
  while (iters--) {
    std::vector<StringPiece> parts;
    split(' ', line, parts);
    s += parts.size();
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_RELATIVE(StringSplit_Gen_Vector, iters) {
  size_t s = 0;
  StringPiece line(kLine);
  while (iters--) {
    s += (split(line, ' ') | as<vector>()).size();
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_DRAW_LINE();

BENCHMARK(StringSplit_Old_ReuseVector, iters) {
  size_t s = 0;
  std::string line(kLine);
  std::vector<StringPiece> parts;
  while (iters--) {
    parts.clear();
    split(' ', line, parts);
    s += parts.size();
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_RELATIVE(StringSplit_Gen_ReuseVector, iters) {
  size_t s = 0;
  StringPiece line(kLine);
  std::vector<StringPiece> parts;
  while (iters--) {
    parts.clear();
    split(line, ' ') | appendTo(parts);
    s += parts.size();
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_RELATIVE(StringSplit_Gen, iters) {
  size_t s = 0;
  StringPiece line(kLine);
  while (iters--) {
    s += split(line, ' ') | count;
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_RELATIVE(StringSplit_Gen_Take, iters) {
  size_t s = 0;
  StringPiece line(kLine);
  while (iters--) {
    s += split(line, ' ') | take(10) | count;
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_DRAW_LINE();

BENCHMARK(StringUnsplit_Old, iters) {
  size_t s = 0;
  while (iters--) {
    fbstring joined;
    join(',', testStrVector, joined);
    s += joined.size();
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_RELATIVE(StringUnsplit_Old_ReusedBuffer, iters) {
  size_t s = 0;
  fbstring joined;
  while (iters--) {
    joined.clear();
    join(',', testStrVector, joined);
    s += joined.size();
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_RELATIVE(StringUnsplit_Gen, iters) {
  size_t s = 0;
  while (iters--) {
    fbstring joined = from(testStrVector) | unsplit(',');
    s += joined.size();
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_RELATIVE(StringUnsplit_Gen_ReusedBuffer, iters) {
  size_t s = 0;
  fbstring buffer;
  while (iters--) {
    buffer.clear();
    from(testStrVector) | unsplit(',', &buffer);
    s += buffer.size();
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_DRAW_LINE();

void StringUnsplit_Gen(size_t iters, size_t joinSize) {
  std::vector<fbstring> v;
  BENCHMARK_SUSPEND {
    FOR_EACH_RANGE (i, 0, joinSize) { v.push_back(to<fbstring>(rand())); }
  }
  size_t s = 0;
  fbstring buffer;
  while (iters--) {
    buffer.clear();
    from(v) | unsplit(',', &buffer);
    s += buffer.size();
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_PARAM(StringUnsplit_Gen, 1000)
BENCHMARK_RELATIVE_PARAM(StringUnsplit_Gen, 2000)
BENCHMARK_RELATIVE_PARAM(StringUnsplit_Gen, 4000)
BENCHMARK_RELATIVE_PARAM(StringUnsplit_Gen, 8000)

BENCHMARK_DRAW_LINE();
void Lines_Gen(size_t iters, int joinSize) {
  size_t s = 0;
  StringPiece content = testFileContent;
  for (size_t i = 0; i < iters; ++i) {
    s += lines(content.subpiece(0, joinSize)) | take(100) | count;
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_PARAM(Lines_Gen, 1e3)
BENCHMARK_RELATIVE_PARAM(Lines_Gen, 2e3)
BENCHMARK_RELATIVE_PARAM(Lines_Gen, 3e3)

BENCHMARK_DRAW_LINE();

// clang-format off
fbstring records = seq<size_t>(1, 1000)
    | mapped([](size_t i) {
      return folly::to<fbstring>(i, ' ', i * i, ' ', i * i * i);
    })
    | unsplit('\n');
// clang-format o

BENCHMARK(Records_EachToTuple, iters) {
  size_t s = 0;
  for (size_t i = 0; i < iters; i += 1000) {
    // clang-format off
    s += split(records, '\n')
        | eachToTuple<int, size_t, StringPiece>(' ')
        | get<1>()
        | sum;
    // clang-format on
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_RELATIVE(Records_VectorStringPieceReused, iters) {
  size_t s = 0;
  std::vector<StringPiece> fields;
  for (size_t i = 0; i < iters; i += 1000) {
    // clang-format off
    s += split(records, '\n')
        | mapped([&](StringPiece line) {
          fields.clear();
          folly::split(' ', line, fields);
          CHECK(fields.size() == 3);
          return std::make_tuple(
              folly::to<int>(fields[0]),
              folly::to<size_t>(fields[1]),
              StringPiece(fields[2]));
        })
        | get<1>()
        | sum;
    // clang-format on
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_RELATIVE(Records_VectorStringPiece, iters) {
  size_t s = 0;
  for (size_t i = 0; i < iters; i += 1000) {
    // clang-format off
    s += split(records, '\n')
        | mapped([](StringPiece line) {
          std::vector<StringPiece> fields;
          folly::split(' ', line, fields);
          CHECK(fields.size() == 3);
          return std::make_tuple(
              folly::to<int>(fields[0]),
              folly::to<size_t>(fields[1]),
              StringPiece(fields[2]));
        })
        | get<1>()
        | sum;
    // clang-format on
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_RELATIVE(Records_VectorString, iters) {
  size_t s = 0;
  for (size_t i = 0; i < iters; i += 1000) {
    // clang-format off
    s += split(records, '\n')
        | mapped([](StringPiece line) {
          std::vector<std::string> fields;
          folly::split(' ', line, fields);
          CHECK(fields.size() == 3);
          return std::make_tuple(
              folly::to<int>(fields[0]),
              folly::to<size_t>(fields[1]),
              StringPiece(fields[2]));
        })
        | get<1>()
        | sum;
    // clang-format on
  }
  folly::doNotOptimizeAway(s);
}

// Results from an Intel(R) Xeon(R) CPU E5-2660 0 @ 2.20GHz
// ============================================================================
// folly/gen/test/StringBenchmark.cpp              relative  time/iter  iters/s
// ============================================================================
// StringResplitter_Big                                       108.58us    9.21K
// StringResplitter_Small                            10.60%     1.02ms   976.48
// ----------------------------------------------------------------------------
// StringSplit_Old                                            357.82ns    2.79M
// StringSplit_Gen_Vector                           105.10%   340.46ns    2.94M
// ----------------------------------------------------------------------------
// StringSplit_Old_ReuseVector                                 96.45ns   10.37M
// StringSplit_Gen_ReuseVector                      124.01%    77.78ns   12.86M
// StringSplit_Gen                                  140.10%    68.85ns   14.52M
// StringSplit_Gen_Take                             122.97%    78.44ns   12.75M
// ----------------------------------------------------------------------------
// StringUnsplit_Old                                           42.99us   23.26K
// StringUnsplit_Old_ReusedBuffer                   100.48%    42.79us   23.37K
// StringUnsplit_Gen                                 96.37%    44.61us   22.42K
// StringUnsplit_Gen_ReusedBuffer                   116.96%    36.76us   27.20K
// ----------------------------------------------------------------------------
// StringUnsplit_Gen(1000)                                     44.71us   22.37K
// StringUnsplit_Gen(2000)                           49.28%    90.72us   11.02K
// StringUnsplit_Gen(4000)                           24.05%   185.91us    5.38K
// StringUnsplit_Gen(8000)                           12.23%   365.42us    2.74K
// ----------------------------------------------------------------------------
// Records_EachToTuple                                        101.43us    9.86K
// Records_VectorStringPieceReused                   93.72%   108.22us    9.24K
// Records_VectorStringPiece                         37.14%   273.11us    3.66K
// Records_VectorString                              16.70%   607.47us    1.65K
// ============================================================================

int main(int argc, char* argv[]) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  initStringResplitterBenchmark();
  runBenchmarks();
  return 0;
}
