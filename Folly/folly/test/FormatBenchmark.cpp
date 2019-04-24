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

#include <folly/Format.h>

#include <glog/logging.h>

#include <folly/Benchmark.h>
#include <folly/FBVector.h>
#include <folly/Utility.h>
#include <folly/dynamic.h>
#include <folly/init/Init.h>
#include <folly/json.h>

using namespace folly;

namespace {

std::array<char, 300> bigBuf;

std::string getShortString() {
  return "ABCDEFGHIJ";
}

std::string getLongString() {
  return std::string(256, 'A');
}

} // namespace

BENCHMARK(octal_snprintf, iters) {
  while (iters--) {
    snprintf(
        bigBuf.data(), bigBuf.size(), "%o", static_cast<unsigned int>(iters));
  }
}

BENCHMARK_RELATIVE(octal_uintToOctal, iters) {
  while (iters--) {
    detail::uintToOctal(
        bigBuf.data(),
        detail::kMaxOctalLength,
        static_cast<unsigned int>(iters));
  }
}

BENCHMARK_DRAW_LINE();

BENCHMARK(hex_snprintf, iters) {
  while (iters--) {
    snprintf(
        bigBuf.data(), bigBuf.size(), "%x", static_cast<unsigned int>(iters));
  }
}

BENCHMARK_RELATIVE(hex_uintToHex, iters) {
  while (iters--) {
    detail::uintToHexLower(
        bigBuf.data(), detail::kMaxHexLength, static_cast<unsigned int>(iters));
  }
}

BENCHMARK_DRAW_LINE();

BENCHMARK(intAppend_snprintf) {
  fbstring out;
  for (int i = -1000; i < 1000; i++) {
    snprintf(bigBuf.data(), bigBuf.size(), "%d", i);
    out.append(bigBuf.data());
  }
}

BENCHMARK_RELATIVE(intAppend_to) {
  fbstring out;
  for (int i = -1000; i < 1000; i++) {
    toAppend(i, &out);
  }
}

BENCHMARK_RELATIVE(intAppend_format) {
  fbstring out;
  for (int i = -1000; i < 1000; i++) {
    format(&out, "{}", i);
  }
}

BENCHMARK_DRAW_LINE();

template <size_t... Indexes>
int snprintf20Numbers(int i, index_sequence<Indexes...>) {
  static_assert(20 == sizeof...(Indexes), "Must have exactly 20 indexes");
  return snprintf(
      bigBuf.data(),
      bigBuf.size(),
      "%d %d %d %d %d"
      "%d %d %d %d %d"
      "%d %d %d %d %d"
      "%d %d %d %d %d",
      (i + static_cast<int>(Indexes))...);
}

BENCHMARK(bigFormat_snprintf, iters) {
  while (iters--) {
    for (int i = -100; i < 100; i++) {
      snprintf20Numbers(i, make_index_sequence<20>());
    }
  }
}

template <size_t... Indexes>
decltype(auto) format20Numbers(int i, index_sequence<Indexes...>) {
  static_assert(20 == sizeof...(Indexes), "Must have exactly 20 indexes");
  return format(
      "{} {} {} {} {}"
      "{} {} {} {} {}"
      "{} {} {} {} {}"
      "{} {} {} {} {}",
      (i + static_cast<int>(Indexes))...);
}

BENCHMARK_RELATIVE(bigFormat_format, iters) {
  BenchmarkSuspender suspender;
  char* p;
  auto writeToBuf = [&p](StringPiece sp) mutable {
    memcpy(p, sp.data(), sp.size());
    p += sp.size();
  };

  while (iters--) {
    for (int i = -100; i < 100; i++) {
      p = bigBuf.data();
      suspender.dismissing(
          [&] { format20Numbers(i, make_index_sequence<20>())(writeToBuf); });
    }
  }
}

BENCHMARK_DRAW_LINE();

BENCHMARK(format_nested_strings, iters) {
  BenchmarkSuspender suspender;
  while (iters--) {
    for (int i = 0; i < 1000; ++i) {
      fbstring out;
      suspender.dismissing([&] {
        format(
            &out,
            "{} {}",
            format("{} {}", i, i + 1).str(),
            format("{} {}", -i, -i - 1).str());
      });
    }
  }
}

BENCHMARK_RELATIVE(format_nested_fbstrings, iters) {
  BenchmarkSuspender suspender;
  while (iters--) {
    for (int i = 0; i < 1000; ++i) {
      fbstring out;
      suspender.dismissing([&] {
        format(
            &out,
            "{} {}",
            format("{} {}", i, i + 1).fbstr(),
            format("{} {}", -i, -i - 1).fbstr());
      });
    }
  }
}

BENCHMARK_RELATIVE(format_nested_direct, iters) {
  BenchmarkSuspender suspender;
  while (iters--) {
    for (int i = 0; i < 1000; ++i) {
      fbstring out;
      suspender.dismissing([&] {
        format(
            &out,
            "{} {}",
            format("{} {}", i, i + 1),
            format("{} {}", -i, -i - 1));
      });
    }
  }
}

BENCHMARK_DRAW_LINE();

BENCHMARK(copy_short_string, iters) {
  BenchmarkSuspender suspender;
  auto const& shortString = getShortString();
  while (iters--) {
    fbstring out;
    suspender.dismissing([&] { out = shortString; });
  }
}

BENCHMARK_RELATIVE(format_short_string_unsafe, iters) {
  BenchmarkSuspender suspender;
  auto const& shortString = getShortString();
  while (iters--) {
    fbstring out;
    suspender.dismissing([&] { format(&out, shortString); });
  }
}

BENCHMARK_RELATIVE(format_short_string_safe, iters) {
  BenchmarkSuspender suspender;
  auto const& shortString = getShortString();
  while (iters--) {
    fbstring out;
    suspender.dismissing([&] { format(&out, "{}", shortString); });
  }
}

BENCHMARK_RELATIVE(sformat_short_string_unsafe, iters) {
  BenchmarkSuspender suspender;
  auto const& shortString = getShortString();
  while (iters--) {
    std::string out;
    suspender.dismissing([&] { out = sformat(shortString); });
  }
}

BENCHMARK_RELATIVE(sformat_short_string_safe, iters) {
  BenchmarkSuspender suspender;
  auto const& shortString = getShortString();
  while (iters--) {
    std::string out;
    suspender.dismissing([&] { out = sformat("{}", shortString); });
  }
}

BENCHMARK_DRAW_LINE();

BENCHMARK(copy_long_string, iters) {
  BenchmarkSuspender suspender;
  auto const& longString = getLongString();
  while (iters--) {
    fbstring out;
    suspender.dismissing([&] { out = longString; });
  }
}

BENCHMARK_RELATIVE(format_long_string_unsafe, iters) {
  BenchmarkSuspender suspender;
  auto const& longString = getLongString();
  while (iters--) {
    fbstring out;
    suspender.dismissing([&] { format(&out, longString); });
  }
}

BENCHMARK_RELATIVE(format_long_string_safe, iters) {
  BenchmarkSuspender suspender;
  auto const& longString = getLongString();
  while (iters--) {
    fbstring out;
    suspender.dismissing([&] { format(&out, "{}", longString); });
  }
}

BENCHMARK_RELATIVE(sformat_long_string_unsafe, iters) {
  BenchmarkSuspender suspender;
  auto const& longString = getLongString();
  while (iters--) {
    std::string out;
    suspender.dismissing([&] { out = sformat(longString); });
  }
}

BENCHMARK_RELATIVE(sformat_long_string_safe, iters) {
  BenchmarkSuspender suspender;
  auto const& longString = getLongString();
  while (iters--) {
    std::string out;
    suspender.dismissing([&] { out = sformat("{}", longString); });
  }
}

// Benchmark results on my dev server (20-core Intel Xeon E5-2660 v2 @ 2.20GHz)
//
// ============================================================================
// folly/test/FormatBenchmark.cpp                  relative  time/iter  iters/s
// ============================================================================
// octal_snprintf                                              79.30ns   12.61M
// octal_uintToOctal                               3452.19%     2.30ns  435.35M
// ----------------------------------------------------------------------------
// hex_snprintf                                                73.59ns   13.59M
// hex_uintToHex                                   4507.53%     1.63ns  612.49M
// ----------------------------------------------------------------------------
// intAppend_snprintf                                         191.50us    5.22K
// intAppend_to                                     552.46%    34.66us   28.85K
// intAppend_format                                 215.76%    88.76us   11.27K
// ----------------------------------------------------------------------------
// bigFormat_snprintf                                         178.03us    5.62K
// bigFormat_format                                  90.41%   196.91us    5.08K
// ----------------------------------------------------------------------------
// format_nested_strings                                      317.65us    3.15K
// format_nested_fbstrings                           99.89%   318.01us    3.14K
// format_nested_direct                             116.52%   272.62us    3.67K
// ----------------------------------------------------------------------------
// copy_short_string                                           28.33ns   35.30M
// format_short_string_unsafe                        82.51%    34.33ns   29.13M
// format_short_string_safe                          58.92%    48.08ns   20.80M
// sformat_short_string_unsafe                       73.90%    38.33ns   26.09M
// sformat_short_string_safe                         54.97%    51.53ns   19.41M
// ----------------------------------------------------------------------------
// copy_long_string                                            57.56ns   17.37M
// format_long_string_unsafe                         68.79%    83.68ns   11.95M
// format_long_string_safe                           69.44%    82.89ns   12.06M
// sformat_long_string_unsafe                        65.58%    87.77ns   11.39M
// sformat_long_string_safe                          68.14%    84.47ns   11.84M
// ============================================================================

int main(int argc, char* argv[]) {
  init(&argc, &argv, true);
  runBenchmarks();
  return 0;
}
