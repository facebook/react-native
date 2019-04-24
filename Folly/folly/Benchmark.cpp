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

// @author Andrei Alexandrescu (andrei.alexandrescu@fb.com)

#include <folly/Benchmark.h>

#include <algorithm>
#include <cmath>
#include <cstring>
#include <iostream>
#include <limits>
#include <map>
#include <memory>
#include <utility>
#include <vector>

#include <boost/regex.hpp>

#include <folly/MapUtil.h>
#include <folly/String.h>
#include <folly/container/Foreach.h>
#include <folly/json.h>

using namespace std;

DEFINE_bool(benchmark, false, "Run benchmarks.");
DEFINE_bool(json, false, "Output in JSON format.");
DEFINE_bool(json_verbose, false, "Output in verbose JSON format.");

DEFINE_string(
    bm_regex,
    "",
    "Only benchmarks whose names match this regex will be run.");

DEFINE_int64(
    bm_min_usec,
    100,
    "Minimum # of microseconds we'll accept for each benchmark.");

DEFINE_int32(
    bm_min_iters,
    1,
    "Minimum # of iterations we'll try for each benchmark.");

DEFINE_int64(
    bm_max_iters,
    1 << 30,
    "Maximum # of iterations we'll try for each benchmark.");

DEFINE_int32(
    bm_max_secs,
    1,
    "Maximum # of seconds we'll spend on each benchmark.");

namespace folly {

std::chrono::high_resolution_clock::duration BenchmarkSuspender::timeSpent;

typedef function<detail::TimeIterPair(unsigned int)> BenchmarkFun;

vector<detail::BenchmarkRegistration>& benchmarks() {
  static vector<detail::BenchmarkRegistration> _benchmarks;
  return _benchmarks;
}

#define FB_FOLLY_GLOBAL_BENCHMARK_BASELINE fbFollyGlobalBenchmarkBaseline
#define FB_STRINGIZE_X2(x) FB_STRINGIZE(x)

// Add the global baseline
BENCHMARK(FB_FOLLY_GLOBAL_BENCHMARK_BASELINE) {
#ifdef _MSC_VER
  _ReadWriteBarrier();
#else
  asm volatile("");
#endif
}

size_t getGlobalBenchmarkBaselineIndex() {
  const char* global = FB_STRINGIZE_X2(FB_FOLLY_GLOBAL_BENCHMARK_BASELINE);
  auto it = std::find_if(
      benchmarks().begin(),
      benchmarks().end(),
      [global](const detail::BenchmarkRegistration& v) {
        return v.name == global;
      });
  CHECK(it != benchmarks().end());
  return size_t(std::distance(benchmarks().begin(), it));
}

#undef FB_STRINGIZE_X2
#undef FB_FOLLY_GLOBAL_BENCHMARK_BASELINE

void detail::addBenchmarkImpl(
    const char* file,
    const char* name,
    BenchmarkFun fun) {
  benchmarks().push_back({file, name, std::move(fun)});
}

/**
 * Given a bunch of benchmark samples, estimate the actual run time.
 */
static double estimateTime(double* begin, double* end) {
  assert(begin < end);

  // Current state of the art: get the minimum. After some
  // experimentation, it seems taking the minimum is the best.
  return *min_element(begin, end);
}

static double runBenchmarkGetNSPerIteration(
    const BenchmarkFun& fun,
    const double globalBaseline) {
  using std::chrono::duration_cast;
  using std::chrono::high_resolution_clock;
  using std::chrono::microseconds;
  using std::chrono::nanoseconds;
  using std::chrono::seconds;

  // They key here is accuracy; too low numbers means the accuracy was
  // coarse. We up the ante until we get to at least minNanoseconds
  // timings.
  static_assert(
      std::is_same<high_resolution_clock::duration, nanoseconds>::value,
      "High resolution clock must be nanosecond resolution.");
  // We choose a minimum minimum (sic) of 100,000 nanoseconds, but if
  // the clock resolution is worse than that, it will be larger. In
  // essence we're aiming at making the quantization noise 0.01%.
  static const auto minNanoseconds = std::max<nanoseconds>(
      nanoseconds(100000), microseconds(FLAGS_bm_min_usec));

  // We do measurements in several epochs and take the minimum, to
  // account for jitter.
  static const unsigned int epochs = 1000;
  // We establish a total time budget as we don't want a measurement
  // to take too long. This will curtail the number of actual epochs.
  const auto timeBudget = seconds(FLAGS_bm_max_secs);
  auto global = high_resolution_clock::now();

  double epochResults[epochs] = {0};
  size_t actualEpochs = 0;

  for (; actualEpochs < epochs; ++actualEpochs) {
    const auto maxIters = uint32_t(FLAGS_bm_max_iters);
    for (auto n = uint32_t(FLAGS_bm_min_iters); n < maxIters; n *= 2) {
      auto const nsecsAndIter = fun(static_cast<unsigned int>(n));
      if (nsecsAndIter.first < minNanoseconds) {
        continue;
      }
      // We got an accurate enough timing, done. But only save if
      // smaller than the current result.
      auto nsecs = duration_cast<nanoseconds>(nsecsAndIter.first).count();
      epochResults[actualEpochs] =
          max(0.0, double(nsecs) / nsecsAndIter.second - globalBaseline);
      // Done with the current epoch, we got a meaningful timing.
      break;
    }
    auto now = high_resolution_clock::now();
    if (now - global >= timeBudget) {
      // No more time budget available.
      ++actualEpochs;
      break;
    }
  }

  // If the benchmark was basically drowned in baseline noise, it's
  // possible it became negative.
  return max(0.0, estimateTime(epochResults, epochResults + actualEpochs));
}

struct ScaleInfo {
  double boundary;
  const char* suffix;
};

static const ScaleInfo kTimeSuffixes[]{
    {365.25 * 24 * 3600, "years"},
    {24 * 3600, "days"},
    {3600, "hr"},
    {60, "min"},
    {1, "s"},
    {1E-3, "ms"},
    {1E-6, "us"},
    {1E-9, "ns"},
    {1E-12, "ps"},
    {1E-15, "fs"},
    {0, nullptr},
};

static const ScaleInfo kMetricSuffixes[]{
    {1E24, "Y"}, // yotta
    {1E21, "Z"}, // zetta
    {1E18, "X"}, // "exa" written with suffix 'X' so as to not create
                 //   confusion with scientific notation
    {1E15, "P"}, // peta
    {1E12, "T"}, // terra
    {1E9, "G"}, // giga
    {1E6, "M"}, // mega
    {1E3, "K"}, // kilo
    {1, ""},
    {1E-3, "m"}, // milli
    {1E-6, "u"}, // micro
    {1E-9, "n"}, // nano
    {1E-12, "p"}, // pico
    {1E-15, "f"}, // femto
    {1E-18, "a"}, // atto
    {1E-21, "z"}, // zepto
    {1E-24, "y"}, // yocto
    {0, nullptr},
};

static string
humanReadable(double n, unsigned int decimals, const ScaleInfo* scales) {
  if (std::isinf(n) || std::isnan(n)) {
    return folly::to<string>(n);
  }

  const double absValue = fabs(n);
  const ScaleInfo* scale = scales;
  while (absValue < scale[0].boundary && scale[1].suffix != nullptr) {
    ++scale;
  }

  const double scaledValue = n / scale->boundary;
  return stringPrintf("%.*f%s", decimals, scaledValue, scale->suffix);
}

static string readableTime(double n, unsigned int decimals) {
  return humanReadable(n, decimals, kTimeSuffixes);
}

static string metricReadable(double n, unsigned int decimals) {
  return humanReadable(n, decimals, kMetricSuffixes);
}

namespace {
class BenchmarkResultsPrinter {
 public:
  static constexpr unsigned int columns{76};
  double baselineNsPerIter{numeric_limits<double>::max()};
  string lastFile;

  void separator(char pad) {
    puts(string(columns, pad).c_str());
  }

  void header(const string& file) {
    separator('=');
    printf("%-*srelative  time/iter  iters/s\n", columns - 28, file.c_str());
    separator('=');
  }

  void print(const vector<detail::BenchmarkResult>& data) {
    for (auto& datum : data) {
      auto file = datum.file;
      if (file != lastFile) {
        // New file starting
        header(file);
        lastFile = file;
      }

      string s = datum.name;
      if (s == "-") {
        separator('-');
        continue;
      }
      bool useBaseline /* = void */;
      if (s[0] == '%') {
        s.erase(0, 1);
        useBaseline = true;
      } else {
        baselineNsPerIter = datum.timeInNs;
        useBaseline = false;
      }
      s.resize(columns - 29, ' ');
      auto nsPerIter = datum.timeInNs;
      auto secPerIter = nsPerIter / 1E9;
      auto itersPerSec = (secPerIter == 0)
          ? std::numeric_limits<double>::infinity()
          : (1 / secPerIter);
      if (!useBaseline) {
        // Print without baseline
        printf(
            "%*s           %9s  %7s\n",
            static_cast<int>(s.size()),
            s.c_str(),
            readableTime(secPerIter, 2).c_str(),
            metricReadable(itersPerSec, 2).c_str());
      } else {
        // Print with baseline
        auto rel = baselineNsPerIter / nsPerIter * 100.0;
        printf(
            "%*s %7.2f%%  %9s  %7s\n",
            static_cast<int>(s.size()),
            s.c_str(),
            rel,
            readableTime(secPerIter, 2).c_str(),
            metricReadable(itersPerSec, 2).c_str());
      }
    }
  }
};
} // namespace

static void printBenchmarkResultsAsJson(
    const vector<detail::BenchmarkResult>& data) {
  dynamic d = dynamic::object;
  for (auto& datum : data) {
    d[datum.name] = datum.timeInNs * 1000.;
  }

  printf("%s\n", toPrettyJson(d).c_str());
}

static void printBenchmarkResultsAsVerboseJson(
    const vector<detail::BenchmarkResult>& data) {
  dynamic d;
  benchmarkResultsToDynamic(data, d);
  printf("%s\n", toPrettyJson(d).c_str());
}

static void printBenchmarkResults(const vector<detail::BenchmarkResult>& data) {
  if (FLAGS_json_verbose) {
    printBenchmarkResultsAsVerboseJson(data);
    return;
  } else if (FLAGS_json) {
    printBenchmarkResultsAsJson(data);
    return;
  }

  CHECK(FLAGS_json_verbose || FLAGS_json) << "Cannot print benchmark results";
}

void benchmarkResultsToDynamic(
    const vector<detail::BenchmarkResult>& data,
    dynamic& out) {
  out = dynamic::array;
  for (auto& datum : data) {
    out.push_back(dynamic::array(datum.file, datum.name, datum.timeInNs));
  }
}

void benchmarkResultsFromDynamic(
    const dynamic& d,
    vector<detail::BenchmarkResult>& results) {
  for (auto& datum : d) {
    results.push_back(
        {datum[0].asString(), datum[1].asString(), datum[2].asDouble()});
  }
}

static pair<StringPiece, StringPiece> resultKey(
    const detail::BenchmarkResult& result) {
  return pair<StringPiece, StringPiece>(result.file, result.name);
}

void printResultComparison(
    const vector<detail::BenchmarkResult>& base,
    const vector<detail::BenchmarkResult>& test) {
  map<pair<StringPiece, StringPiece>, double> baselines;

  for (auto& baseResult : base) {
    baselines[resultKey(baseResult)] = baseResult.timeInNs;
  }
  //
  // Width available
  static const unsigned int columns = 76;

  // Compute the longest benchmark name
  size_t longestName = 0;
  for (auto& datum : test) {
    longestName = max(longestName, datum.name.size());
  }

  // Print a horizontal rule
  auto separator = [&](char pad) { puts(string(columns, pad).c_str()); };

  // Print header for a file
  auto header = [&](const string& file) {
    separator('=');
    printf("%-*srelative  time/iter  iters/s\n", columns - 28, file.c_str());
    separator('=');
  };

  string lastFile;

  for (auto& datum : test) {
    folly::Optional<double> baseline =
        folly::get_optional(baselines, resultKey(datum));
    auto file = datum.file;
    if (file != lastFile) {
      // New file starting
      header(file);
      lastFile = file;
    }

    string s = datum.name;
    if (s == "-") {
      separator('-');
      continue;
    }
    if (s[0] == '%') {
      s.erase(0, 1);
    }
    s.resize(columns - 29, ' ');
    auto nsPerIter = datum.timeInNs;
    auto secPerIter = nsPerIter / 1E9;
    auto itersPerSec = (secPerIter == 0)
        ? std::numeric_limits<double>::infinity()
        : (1 / secPerIter);
    if (!baseline) {
      // Print without baseline
      printf(
          "%*s           %9s  %7s\n",
          static_cast<int>(s.size()),
          s.c_str(),
          readableTime(secPerIter, 2).c_str(),
          metricReadable(itersPerSec, 2).c_str());
    } else {
      // Print with baseline
      auto rel = *baseline / nsPerIter * 100.0;
      printf(
          "%*s %7.2f%%  %9s  %7s\n",
          static_cast<int>(s.size()),
          s.c_str(),
          rel,
          readableTime(secPerIter, 2).c_str(),
          metricReadable(itersPerSec, 2).c_str());
    }
  }
  separator('=');
}

void runBenchmarks() {
  CHECK(!benchmarks().empty());

  vector<detail::BenchmarkResult> results;
  results.reserve(benchmarks().size() - 1);

  std::unique_ptr<boost::regex> bmRegex;
  if (!FLAGS_bm_regex.empty()) {
    bmRegex = std::make_unique<boost::regex>(FLAGS_bm_regex);
  }

  // PLEASE KEEP QUIET. MEASUREMENTS IN PROGRESS.

  size_t baselineIndex = getGlobalBenchmarkBaselineIndex();

  auto const globalBaseline =
      runBenchmarkGetNSPerIteration(benchmarks()[baselineIndex].func, 0);
  auto printer = BenchmarkResultsPrinter{};
  FOR_EACH_RANGE (i, 0, benchmarks().size()) {
    if (i == baselineIndex) {
      continue;
    }
    double elapsed = 0.0;
    auto& bm = benchmarks()[i];
    if (bm.name != "-") { // skip separators
      if (bmRegex && !boost::regex_search(bm.name, *bmRegex)) {
        continue;
      }
      elapsed = runBenchmarkGetNSPerIteration(bm.func, globalBaseline);
    }

    if (!FLAGS_json_verbose && !FLAGS_json) {
      printer.print({{bm.file, bm.name, elapsed}});
    } else {
      results.push_back({bm.file, bm.name, elapsed});
    }
  }

  // PLEASE MAKE NOISE. MEASUREMENTS DONE.

  if (FLAGS_json_verbose || FLAGS_json) {
    printBenchmarkResults(results);
  } else {
    printer.separator('=');
  }
}

} // namespace folly
