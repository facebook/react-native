/*
 * Copyright 2017-present Facebook, Inc.
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

#include <folly/Benchmark.h>
#include <folly/experimental/flat_combining/test/FlatCombiningTestHelpers.h>

#include <folly/portability/GTest.h>
#include <glog/logging.h>

using namespace folly::test;

// use option --benchmark to run folly::Benchmark
// use option --direct to run direct benchmark measurements
DEFINE_bool(direct, false, "run direct measurement");
DEFINE_int32(reps, 10, "number of reps");
DEFINE_int32(ops, 100000, "number of operations per rep");
DEFINE_int32(lines, 5, "number of cache lines accessed per operation");
DEFINE_int32(numRecs, 8, "number of records");
DEFINE_int32(work, 1000, "amount of unrelated work per operation");

static std::vector<int> nthr = {1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64};
static int nthreads;
static bool fc;
static bool simple;
static bool dedicated;
static bool tc;
static bool syncops;

// baseline - no combining
BENCHMARK(no_combining_base, iters) {
  fc = false;
  dedicated = false;
  tc = false;
  syncops = false;
  run_test(
      nthreads,
      FLAGS_lines,
      FLAGS_numRecs,
      FLAGS_work,
      iters,
      fc,
      simple,
      dedicated,
      tc,
      syncops);
}

BENCHMARK_RELATIVE(no_combining_dup, iters) {
  run_test(
      nthreads,
      FLAGS_lines,
      FLAGS_numRecs,
      FLAGS_work,
      iters,
      fc,
      simple,
      dedicated,
      tc,
      syncops);
}
BENCHMARK_DRAW_LINE();

// dedicated combiner

BENCHMARK_DRAW_LINE();

BENCHMARK_RELATIVE(combining_dedicated_notc_sync, iters) {
  fc = true;
  dedicated = true;
  tc = false;
  syncops = true;
  run_test(
      nthreads,
      FLAGS_lines,
      FLAGS_numRecs,
      FLAGS_work,
      iters,
      fc,
      simple,
      dedicated,
      tc,
      syncops);
}

BENCHMARK_RELATIVE(combining_dedicated_notc_sync_dup, iters) {
  run_test(
      nthreads,
      FLAGS_lines,
      FLAGS_numRecs,
      FLAGS_work,
      iters,
      fc,
      simple,
      dedicated,
      tc,
      syncops);
}

BENCHMARK_DRAW_LINE();

BENCHMARK_RELATIVE(combining_dedicated_notc_async, iters) {
  syncops = false;
  run_test(
      nthreads,
      FLAGS_lines,
      FLAGS_numRecs,
      FLAGS_work,
      iters,
      fc,
      simple,
      dedicated,
      tc,
      syncops);
}

BENCHMARK_RELATIVE(combining_dedicated_notc_async_dup, iters) {
  run_test(
      nthreads,
      FLAGS_lines,
      FLAGS_numRecs,
      FLAGS_work,
      iters,
      fc,
      simple,
      dedicated,
      tc,
      syncops);
}

BENCHMARK_DRAW_LINE();

BENCHMARK_RELATIVE(combining_dedicated_tc_sync, iters) {
  tc = true;
  syncops = true;
  run_test(
      nthreads,
      FLAGS_lines,
      FLAGS_numRecs,
      FLAGS_work,
      iters,
      fc,
      simple,
      dedicated,
      tc,
      syncops);
}

BENCHMARK_RELATIVE(combining_dedicated_tc_sync_dup, iters) {
  run_test(
      nthreads,
      FLAGS_lines,
      FLAGS_numRecs,
      FLAGS_work,
      iters,
      fc,
      simple,
      dedicated,
      tc,
      syncops);
}

BENCHMARK_DRAW_LINE();

BENCHMARK_RELATIVE(combining_dedicated_tc_async, iters) {
  tc = true;
  syncops = false;
  run_test(
      nthreads,
      FLAGS_lines,
      FLAGS_numRecs,
      FLAGS_work,
      iters,
      fc,
      simple,
      dedicated,
      tc,
      syncops);
}

BENCHMARK_RELATIVE(combining_dedicated_tc_async_dup, iters) {
  run_test(
      nthreads,
      FLAGS_lines,
      FLAGS_numRecs,
      FLAGS_work,
      iters,
      fc,
      simple,
      dedicated,
      tc,
      syncops);
}

BENCHMARK_DRAW_LINE();

// no dedicated combiner

BENCHMARK_DRAW_LINE();

BENCHMARK_RELATIVE(combining_no_dedicated_notc_sync, iters) {
  dedicated = false;
  tc = false;
  syncops = true;
  run_test(
      nthreads,
      FLAGS_lines,
      FLAGS_numRecs,
      FLAGS_work,
      iters,
      fc,
      simple,
      dedicated,
      tc,
      syncops);
}

BENCHMARK_RELATIVE(combining_no_dedicated_notc_sync_dup, iters) {
  run_test(
      nthreads,
      FLAGS_lines,
      FLAGS_numRecs,
      FLAGS_work,
      iters,
      fc,
      simple,
      dedicated,
      tc,
      syncops);
}

BENCHMARK_DRAW_LINE();

BENCHMARK_RELATIVE(combining_no_dedicated_notc_async, iters) {
  syncops = false;
  run_test(
      nthreads,
      FLAGS_lines,
      FLAGS_numRecs,
      FLAGS_work,
      iters,
      fc,
      simple,
      dedicated,
      tc,
      syncops);
}

BENCHMARK_RELATIVE(combining_no_dedicated_notc_async_dup, iters) {
  run_test(
      nthreads,
      FLAGS_lines,
      FLAGS_numRecs,
      FLAGS_work,
      iters,
      fc,
      simple,
      dedicated,
      tc,
      syncops);
}

BENCHMARK_DRAW_LINE();

BENCHMARK_RELATIVE(combining_no_dedicated_tc_sync, iters) {
  tc = true;
  syncops = true;
  run_test(
      nthreads,
      FLAGS_lines,
      FLAGS_numRecs,
      FLAGS_work,
      iters,
      fc,
      simple,
      dedicated,
      tc,
      syncops);
}

BENCHMARK_RELATIVE(combining_no_dedicated_tc_sync_dup, iters) {
  run_test(
      nthreads,
      FLAGS_lines,
      FLAGS_numRecs,
      FLAGS_work,
      iters,
      fc,
      simple,
      dedicated,
      tc,
      syncops);
}

BENCHMARK_DRAW_LINE();

BENCHMARK_RELATIVE(combining_no_dedicated_tc_async, iters) {
  tc = true;
  syncops = false;
  run_test(
      nthreads,
      FLAGS_lines,
      FLAGS_numRecs,
      FLAGS_work,
      iters,
      fc,
      simple,
      dedicated,
      tc,
      syncops);
}

BENCHMARK_RELATIVE(combining_no_dedicated_tc_async_dup, iters) {
  run_test(
      nthreads,
      FLAGS_lines,
      FLAGS_numRecs,
      FLAGS_work,
      iters,
      fc,
      simple,
      dedicated,
      tc,
      syncops);
}

BENCHMARK_DRAW_LINE();

void benchmarkSetup() {
  int numCores = std::thread::hardware_concurrency();
  std::cout << "\nRunning benchmarks on machine with " << numCores
            << " logical cores" << std::endl;
}

TEST(FlatCombining, folly_benchmark) {
  if (FLAGS_benchmark) {
    benchmarkSetup();
    for (bool b : {true, false}) {
      simple = b;
      std::string str = simple ? "simple" : "custom";
      std::cout << "\n------------------------------------ " << str
                << " interface" << std::endl;
      for (int i : nthr) {
        std::cout << "\n---------------------------------- Number of threads = "
                  << i << std::endl;
        nthreads = i;
        folly::runBenchmarks();
      }
    }
  }
}

// Direct measurement - not using folly::Benchmark

static uint64_t test(
    std::string name,
    bool fc_,
    bool dedicated_,
    bool tc_,
    bool syncops_,
    uint64_t base) {
  uint64_t min = UINTMAX_MAX;
  uint64_t max = 0;
  uint64_t sum = 0;

  for (int i = 0; i < FLAGS_reps; ++i) {
    uint64_t dur = run_test(
        nthreads,
        FLAGS_lines,
        FLAGS_numRecs,
        FLAGS_work,
        FLAGS_ops,
        fc_,
        simple,
        dedicated_,
        tc_,
        syncops_);
    sum += dur;
    min = std::min(min, dur);
    max = std::max(max, dur);
  }
  uint64_t avg = sum / FLAGS_reps;

  uint64_t res = min;
  std::cout << name;
  std::cout << "   " << std::setw(4) << max / FLAGS_ops << " ns";
  std::cout << "   " << std::setw(4) << avg / FLAGS_ops << " ns";
  std::cout << "   " << std::setw(4) << res / FLAGS_ops << " ns";
  if (base) {
    std::cout << " " << std::setw(3) << 100 * base / res << "%";
  }
  std::cout << std::endl;
  return res;
}

TEST(FlatCombining, direct_measurement) {
  if (!FLAGS_direct) {
    return;
  }
  benchmarkSetup();
  simple = false;
  std::string str = simple ? "simple" : "custom";
  std::cout << "\n------------------------------------ " << str << " interface"
            << std::endl;
  for (int i : nthr) {
    nthreads = i;
    std::cout << "\n------------------------------------ Number of threads = "
              << i << "\n"
              << std::endl;
    std::cout << "Test_name, Max time, Avg time, Min time, % base min / min\n"
              << std::endl;

    uint64_t base =
        test("no_combining - base         ", false, false, false, false, 0);
    test("no_combining - dup          ", false, false, false, false, base);
    std::cout << "---------------------------------------" << std::endl;

    std::cout << "---- dedicated-------------------------" << std::endl;
    test("combining_notc_sync         ", true, true, false, true, base);
    test("combining_notc_sync - dup   ", true, true, false, true, base);
    std::cout << "---------------------------------------" << std::endl;
    test("combining_notc_async        ", true, true, false, false, base);
    test("combining_notc_async - dup  ", true, true, false, false, base);
    std::cout << "---------------------------------------" << std::endl;
    test("combining_tc_sync           ", true, true, true, true, base);
    test("combining_tc_sync - dup     ", true, true, true, true, base);
    std::cout << "---------------------------------------" << std::endl;
    test("combining_tc_async          ", true, true, true, false, base);
    test("combining_tc_async - dup    ", true, true, true, false, base);
    std::cout << "---------------------------------------" << std::endl;

    std::cout << "---- no dedicated----------------------" << std::endl;
    test("combining_notc_sync         ", true, false, false, true, base);
    test("combining_notc_sync - dup   ", true, false, false, true, base);
    std::cout << "---------------------------------------" << std::endl;
    test("combining_notc_async        ", true, false, false, false, base);
    test("combining_notc_async - dup  ", true, false, false, false, base);
    std::cout << "---------------------------------------" << std::endl;
    test("combining_tc_sync           ", true, false, true, true, base);
    test("combining_tc_sync - dup     ", true, false, true, true, base);
    std::cout << "---------------------------------------" << std::endl;
    test("combining_tc_async          ", true, false, true, false, base);
    test("combining_tc_async - dup    ", true, false, true, false, base);
    std::cout << "---------------------------------------" << std::endl;
  }
}

// clang-format off
/*
See benchmark results in https://phabricator.intern.facebook.com/P57204895

The results are from a run using the command
$ numactl -N 1 flat_combining_benchmark --benchmark --bm_min_iters=100000 --direct

Using the default parameters of the benchmark: In each iteration, the
operation on the shared data structure updates 5 cache lines and
performs unrelated work (~300ns) after each operation. The benchmark
doesn't do any smart combining (i.e., saving or dropping some work
based on understanding the details of the combined operations).

Direct measurements are used to evaluate the high variance in some cases.
Duplicate runs are included in order to assess the relevance of outliers.

----
[==========] Running 2 tests from 1 test case.
[----------] Global test environment set-up.
[----------] 2 tests from FlatCombining
[ RUN      ] FlatCombining.folly_benchmark

Running benchmarks on machine with 32 logical cores

------------------------------------ simple interface

---------------------------------- Number of threads = 1
============================================================================
folly/experimental/flat_combining/test/FlatCombiningBenchmark.cpprelative  time/iter  iters/s
============================================================================
no_combining_base                                          330.43ns    3.03M
no_combining_dup                                 100.09%   330.13ns    3.03M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_dedicated_notc_sync                     93.17%   354.66ns    2.82M
combining_dedicated_notc_sync_dup                 93.57%   353.15ns    2.83M
----------------------------------------------------------------------------
combining_dedicated_notc_async                    99.35%   332.60ns    3.01M
combining_dedicated_notc_async_dup                99.07%   333.54ns    3.00M
----------------------------------------------------------------------------
combining_dedicated_tc_sync                       93.05%   355.13ns    2.82M
combining_dedicated_tc_sync_dup                   92.87%   355.81ns    2.81M
----------------------------------------------------------------------------
combining_dedicated_tc_async                      99.17%   333.21ns    3.00M
combining_dedicated_tc_async_dup                  99.28%   332.84ns    3.00M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_no_dedicated_notc_sync                  93.51%   353.38ns    2.83M
combining_no_dedicated_notc_sync_dup              93.27%   354.26ns    2.82M
----------------------------------------------------------------------------
combining_no_dedicated_notc_async                 99.40%   332.44ns    3.01M
combining_no_dedicated_notc_async_dup             99.13%   333.34ns    3.00M
----------------------------------------------------------------------------
combining_no_dedicated_tc_sync                    93.38%   353.86ns    2.83M
combining_no_dedicated_tc_sync_dup                93.52%   353.31ns    2.83M
----------------------------------------------------------------------------
combining_no_dedicated_tc_async                   99.29%   332.78ns    3.00M
combining_no_dedicated_tc_async_dup               99.19%   333.11ns    3.00M
----------------------------------------------------------------------------
============================================================================

---------------------------------- Number of threads = 2
============================================================================
folly/experimental/flat_combining/test/FlatCombiningBenchmark.cpprelative  time/iter  iters/s
============================================================================
no_combining_base                                          213.60ns    4.68M
no_combining_dup                                 100.84%   211.82ns    4.72M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_dedicated_notc_sync                     89.84%   237.76ns    4.21M
combining_dedicated_notc_sync_dup                 89.85%   237.73ns    4.21M
----------------------------------------------------------------------------
combining_dedicated_notc_async                    93.80%   227.72ns    4.39M
combining_dedicated_notc_async_dup                87.85%   243.15ns    4.11M
----------------------------------------------------------------------------
combining_dedicated_tc_sync                       86.81%   246.06ns    4.06M
combining_dedicated_tc_sync_dup                   87.15%   245.09ns    4.08M
----------------------------------------------------------------------------
combining_dedicated_tc_async                      92.14%   231.82ns    4.31M
combining_dedicated_tc_async_dup                  92.04%   232.08ns    4.31M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_no_dedicated_notc_sync                  95.20%   224.36ns    4.46M
combining_no_dedicated_notc_sync_dup              95.40%   223.91ns    4.47M
----------------------------------------------------------------------------
combining_no_dedicated_notc_async                 95.41%   223.89ns    4.47M
combining_no_dedicated_notc_async_dup             95.86%   222.82ns    4.49M
----------------------------------------------------------------------------
combining_no_dedicated_tc_sync                    94.43%   226.21ns    4.42M
combining_no_dedicated_tc_sync_dup                94.28%   226.56ns    4.41M
----------------------------------------------------------------------------
combining_no_dedicated_tc_async                   96.62%   221.07ns    4.52M
combining_no_dedicated_tc_async_dup               97.24%   219.66ns    4.55M
----------------------------------------------------------------------------
============================================================================

---------------------------------- Number of threads = 3
============================================================================
folly/experimental/flat_combining/test/FlatCombiningBenchmark.cpprelative  time/iter  iters/s
============================================================================
no_combining_base                                          188.20ns    5.31M
no_combining_dup                                  94.07%   200.07ns    5.00M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_dedicated_notc_sync                     95.39%   197.30ns    5.07M
combining_dedicated_notc_sync_dup                 94.50%   199.16ns    5.02M
----------------------------------------------------------------------------
combining_dedicated_notc_async                    75.29%   249.96ns    4.00M
combining_dedicated_notc_async_dup                72.97%   257.91ns    3.88M
----------------------------------------------------------------------------
combining_dedicated_tc_sync                       91.26%   206.22ns    4.85M
combining_dedicated_tc_sync_dup                   90.68%   207.54ns    4.82M
----------------------------------------------------------------------------
combining_dedicated_tc_async                      89.64%   209.95ns    4.76M
combining_dedicated_tc_async_dup                  88.21%   213.36ns    4.69M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_no_dedicated_notc_sync                  96.19%   195.66ns    5.11M
combining_no_dedicated_notc_sync_dup              93.27%   201.78ns    4.96M
----------------------------------------------------------------------------
combining_no_dedicated_notc_async                 81.12%   231.99ns    4.31M
combining_no_dedicated_notc_async_dup             82.48%   228.19ns    4.38M
----------------------------------------------------------------------------
combining_no_dedicated_tc_sync                    79.48%   236.78ns    4.22M
combining_no_dedicated_tc_sync_dup                79.73%   236.04ns    4.24M
----------------------------------------------------------------------------
combining_no_dedicated_tc_async                  100.70%   186.90ns    5.35M
combining_no_dedicated_tc_async_dup               99.43%   189.27ns    5.28M
----------------------------------------------------------------------------
============================================================================

---------------------------------- Number of threads = 4
============================================================================
folly/experimental/flat_combining/test/FlatCombiningBenchmark.cpprelative  time/iter  iters/s
============================================================================
no_combining_base                                          242.84ns    4.12M
no_combining_dup                                 100.78%   240.96ns    4.15M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_dedicated_notc_sync                    100.91%   240.65ns    4.16M
combining_dedicated_notc_sync_dup                 99.76%   243.42ns    4.11M
----------------------------------------------------------------------------
combining_dedicated_notc_async                   102.06%   237.95ns    4.20M
combining_dedicated_notc_async_dup               101.63%   238.94ns    4.19M
----------------------------------------------------------------------------
combining_dedicated_tc_sync                      109.79%   221.18ns    4.52M
combining_dedicated_tc_sync_dup                  108.94%   222.92ns    4.49M
----------------------------------------------------------------------------
combining_dedicated_tc_async                     133.01%   182.58ns    5.48M
combining_dedicated_tc_async_dup                 134.91%   180.00ns    5.56M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_no_dedicated_notc_sync                 108.77%   223.25ns    4.48M
combining_no_dedicated_notc_sync_dup             107.64%   225.61ns    4.43M
----------------------------------------------------------------------------
combining_no_dedicated_notc_async                115.14%   210.91ns    4.74M
combining_no_dedicated_notc_async_dup            115.06%   211.05ns    4.74M
----------------------------------------------------------------------------
combining_no_dedicated_tc_sync                   116.36%   208.70ns    4.79M
combining_no_dedicated_tc_sync_dup               115.70%   209.89ns    4.76M
----------------------------------------------------------------------------
combining_no_dedicated_tc_async                  159.69%   152.07ns    6.58M
combining_no_dedicated_tc_async_dup              158.27%   153.43ns    6.52M
----------------------------------------------------------------------------
============================================================================

---------------------------------- Number of threads = 6
============================================================================
folly/experimental/flat_combining/test/FlatCombiningBenchmark.cpprelative  time/iter  iters/s
============================================================================
no_combining_base                                          281.36ns    3.55M
no_combining_dup                                  98.56%   285.46ns    3.50M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_dedicated_notc_sync                    132.39%   212.51ns    4.71M
combining_dedicated_notc_sync_dup                133.10%   211.38ns    4.73M
----------------------------------------------------------------------------
combining_dedicated_notc_async                   141.35%   199.05ns    5.02M
combining_dedicated_notc_async_dup               143.18%   196.51ns    5.09M
----------------------------------------------------------------------------
combining_dedicated_tc_sync                      138.94%   202.50ns    4.94M
combining_dedicated_tc_sync_dup                  138.64%   202.93ns    4.93M
----------------------------------------------------------------------------
combining_dedicated_tc_async                     199.76%   140.85ns    7.10M
combining_dedicated_tc_async_dup                 200.28%   140.48ns    7.12M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_no_dedicated_notc_sync                 155.48%   180.96ns    5.53M
combining_no_dedicated_notc_sync_dup             150.82%   186.55ns    5.36M
----------------------------------------------------------------------------
combining_no_dedicated_notc_async                162.23%   173.43ns    5.77M
combining_no_dedicated_notc_async_dup            161.33%   174.39ns    5.73M
----------------------------------------------------------------------------
combining_no_dedicated_tc_sync                   167.90%   167.57ns    5.97M
combining_no_dedicated_tc_sync_dup               164.84%   170.69ns    5.86M
----------------------------------------------------------------------------
combining_no_dedicated_tc_async                  242.51%   116.02ns    8.62M
combining_no_dedicated_tc_async_dup              245.67%   114.53ns    8.73M
----------------------------------------------------------------------------
============================================================================

---------------------------------- Number of threads = 8
============================================================================
folly/experimental/flat_combining/test/FlatCombiningBenchmark.cpprelative  time/iter  iters/s
============================================================================
no_combining_base                                          315.57ns    3.17M
no_combining_dup                                  98.83%   319.32ns    3.13M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_dedicated_notc_sync                    170.48%   185.11ns    5.40M
combining_dedicated_notc_sync_dup                174.57%   180.77ns    5.53M
----------------------------------------------------------------------------
combining_dedicated_notc_async                   178.57%   176.72ns    5.66M
combining_dedicated_notc_async_dup               181.30%   174.06ns    5.75M
----------------------------------------------------------------------------
combining_dedicated_tc_sync                      195.40%   161.50ns    6.19M
combining_dedicated_tc_sync_dup                  197.18%   160.05ns    6.25M
----------------------------------------------------------------------------
combining_dedicated_tc_async                     322.03%    97.99ns   10.20M
combining_dedicated_tc_async_dup                 324.51%    97.24ns   10.28M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_no_dedicated_notc_sync                 205.61%   153.48ns    6.52M
combining_no_dedicated_notc_sync_dup             204.94%   153.98ns    6.49M
----------------------------------------------------------------------------
combining_no_dedicated_notc_async                217.81%   144.88ns    6.90M
combining_no_dedicated_notc_async_dup            218.58%   144.37ns    6.93M
----------------------------------------------------------------------------
combining_no_dedicated_tc_sync                   223.96%   140.91ns    7.10M
combining_no_dedicated_tc_sync_dup               224.55%   140.53ns    7.12M
----------------------------------------------------------------------------
combining_no_dedicated_tc_async                  364.58%    86.56ns   11.55M
combining_no_dedicated_tc_async_dup              363.33%    86.86ns   11.51M
----------------------------------------------------------------------------
============================================================================

---------------------------------- Number of threads = 12
============================================================================
folly/experimental/flat_combining/test/FlatCombiningBenchmark.cpprelative  time/iter  iters/s
============================================================================
no_combining_base                                          353.59ns    2.83M
no_combining_dup                                  99.91%   353.91ns    2.83M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_dedicated_notc_sync                    276.36%   127.95ns    7.82M
combining_dedicated_notc_sync_dup                278.88%   126.79ns    7.89M
----------------------------------------------------------------------------
combining_dedicated_notc_async                   249.52%   141.71ns    7.06M
combining_dedicated_notc_async_dup               247.26%   143.00ns    6.99M
----------------------------------------------------------------------------
combining_dedicated_tc_sync                      318.57%   110.99ns    9.01M
combining_dedicated_tc_sync_dup                  326.27%   108.37ns    9.23M
----------------------------------------------------------------------------
combining_dedicated_tc_async                     428.50%    82.52ns   12.12M
combining_dedicated_tc_async_dup                 429.19%    82.39ns   12.14M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_no_dedicated_notc_sync                 276.54%   127.86ns    7.82M
combining_no_dedicated_notc_sync_dup             275.59%   128.31ns    7.79M
----------------------------------------------------------------------------
combining_no_dedicated_notc_async                298.92%   118.29ns    8.45M
combining_no_dedicated_notc_async_dup            298.93%   118.28ns    8.45M
----------------------------------------------------------------------------
combining_no_dedicated_tc_sync                   300.56%   117.64ns    8.50M
combining_no_dedicated_tc_sync_dup               296.95%   119.07ns    8.40M
----------------------------------------------------------------------------
combining_no_dedicated_tc_async                  431.06%    82.03ns   12.19M
combining_no_dedicated_tc_async_dup              430.40%    82.15ns   12.17M
----------------------------------------------------------------------------
============================================================================

---------------------------------- Number of threads = 16
============================================================================
folly/experimental/flat_combining/test/FlatCombiningBenchmark.cpprelative  time/iter  iters/s
============================================================================
no_combining_base                                          358.57ns    2.79M
no_combining_dup                                  99.97%   358.70ns    2.79M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_dedicated_notc_sync                    319.73%   112.15ns    8.92M
combining_dedicated_notc_sync_dup                327.86%   109.37ns    9.14M
----------------------------------------------------------------------------
combining_dedicated_notc_async                   296.17%   121.07ns    8.26M
combining_dedicated_notc_async_dup               306.86%   116.85ns    8.56M
----------------------------------------------------------------------------
combining_dedicated_tc_sync                      337.53%   106.24ns    9.41M
combining_dedicated_tc_sync_dup                  347.98%   103.04ns    9.70M
----------------------------------------------------------------------------
combining_dedicated_tc_async                     423.80%    84.61ns   11.82M
combining_dedicated_tc_async_dup                 421.07%    85.16ns   11.74M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_no_dedicated_notc_sync                 321.94%   111.38ns    8.98M
combining_no_dedicated_notc_sync_dup             318.54%   112.57ns    8.88M
----------------------------------------------------------------------------
combining_no_dedicated_notc_async                364.71%    98.32ns   10.17M
combining_no_dedicated_notc_async_dup            364.22%    98.45ns   10.16M
----------------------------------------------------------------------------
combining_no_dedicated_tc_sync                   322.91%   111.04ns    9.01M
combining_no_dedicated_tc_sync_dup               322.42%   111.21ns    8.99M
----------------------------------------------------------------------------
combining_no_dedicated_tc_async                  466.30%    76.90ns   13.00M
combining_no_dedicated_tc_async_dup              462.76%    77.49ns   12.91M
----------------------------------------------------------------------------
============================================================================

---------------------------------- Number of threads = 24
============================================================================
folly/experimental/flat_combining/test/FlatCombiningBenchmark.cpprelative  time/iter  iters/s
============================================================================
no_combining_base                                          348.54ns    2.87M
no_combining_dup                                  99.96%   348.69ns    2.87M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_dedicated_notc_sync                    260.21%   133.95ns    7.47M
combining_dedicated_notc_sync_dup                257.84%   135.18ns    7.40M
----------------------------------------------------------------------------
combining_dedicated_notc_async                   242.25%   143.88ns    6.95M
combining_dedicated_notc_async_dup               235.88%   147.76ns    6.77M
----------------------------------------------------------------------------
combining_dedicated_tc_sync                      262.45%   132.80ns    7.53M
combining_dedicated_tc_sync_dup                  251.14%   138.78ns    7.21M
----------------------------------------------------------------------------
combining_dedicated_tc_async                     256.89%   135.68ns    7.37M
combining_dedicated_tc_async_dup                 304.76%   114.37ns    8.74M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_no_dedicated_notc_sync                 270.20%   129.00ns    7.75M
combining_no_dedicated_notc_sync_dup             271.69%   128.29ns    7.80M
----------------------------------------------------------------------------
combining_no_dedicated_notc_async                298.35%   116.82ns    8.56M
combining_no_dedicated_notc_async_dup            289.04%   120.59ns    8.29M
----------------------------------------------------------------------------
combining_no_dedicated_tc_sync                   286.59%   121.62ns    8.22M
combining_no_dedicated_tc_sync_dup               292.21%   119.28ns    8.38M
----------------------------------------------------------------------------
combining_no_dedicated_tc_async                  471.86%    73.87ns   13.54M
combining_no_dedicated_tc_async_dup              458.16%    76.08ns   13.14M
----------------------------------------------------------------------------
============================================================================

---------------------------------- Number of threads = 32
============================================================================
folly/experimental/flat_combining/test/FlatCombiningBenchmark.cpprelative  time/iter  iters/s
============================================================================
no_combining_base                                          337.61ns    2.96M
no_combining_dup                                  99.41%   339.60ns    2.94M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_dedicated_notc_sync                    204.50%   165.09ns    6.06M
combining_dedicated_notc_sync_dup                233.28%   144.72ns    6.91M
----------------------------------------------------------------------------
combining_dedicated_notc_async                   187.20%   180.35ns    5.54M
combining_dedicated_notc_async_dup               192.76%   175.15ns    5.71M
----------------------------------------------------------------------------
combining_dedicated_tc_sync                      220.56%   153.07ns    6.53M
combining_dedicated_tc_sync_dup                  207.62%   162.61ns    6.15M
----------------------------------------------------------------------------
combining_dedicated_tc_async                     317.11%   106.46ns    9.39M
combining_dedicated_tc_async_dup                 318.92%   105.86ns    9.45M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_no_dedicated_notc_sync                 259.29%   130.21ns    7.68M
combining_no_dedicated_notc_sync_dup             248.33%   135.95ns    7.36M
----------------------------------------------------------------------------
combining_no_dedicated_notc_async                290.40%   116.26ns    8.60M
combining_no_dedicated_notc_async_dup            299.92%   112.57ns    8.88M
----------------------------------------------------------------------------
combining_no_dedicated_tc_sync                   281.91%   119.76ns    8.35M
combining_no_dedicated_tc_sync_dup               284.19%   118.80ns    8.42M
----------------------------------------------------------------------------
combining_no_dedicated_tc_async                  435.16%    77.58ns   12.89M
combining_no_dedicated_tc_async_dup              389.67%    86.64ns   11.54M
----------------------------------------------------------------------------
============================================================================

---------------------------------- Number of threads = 48
============================================================================
folly/experimental/flat_combining/test/FlatCombiningBenchmark.cpprelative  time/iter  iters/s
============================================================================
no_combining_base                                          334.48ns    2.99M
no_combining_dup                                 100.00%   334.46ns    2.99M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_dedicated_notc_sync                    257.01%   130.14ns    7.68M
combining_dedicated_notc_sync_dup                254.13%   131.62ns    7.60M
----------------------------------------------------------------------------
combining_dedicated_notc_async                   189.56%   176.45ns    5.67M
combining_dedicated_notc_async_dup               247.68%   135.05ns    7.40M
----------------------------------------------------------------------------
combining_dedicated_tc_sync                      259.47%   128.91ns    7.76M
combining_dedicated_tc_sync_dup                  281.34%   118.89ns    8.41M
----------------------------------------------------------------------------
combining_dedicated_tc_async                     301.96%   110.77ns    9.03M
combining_dedicated_tc_async_dup                 347.65%    96.21ns   10.39M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_no_dedicated_notc_sync                 268.45%   124.60ns    8.03M
combining_no_dedicated_notc_sync_dup             272.54%   122.73ns    8.15M
----------------------------------------------------------------------------
combining_no_dedicated_notc_async                306.04%   109.29ns    9.15M
combining_no_dedicated_notc_async_dup            294.38%   113.62ns    8.80M
----------------------------------------------------------------------------
combining_no_dedicated_tc_sync                   280.89%   119.08ns    8.40M
combining_no_dedicated_tc_sync_dup               276.01%   121.18ns    8.25M
----------------------------------------------------------------------------
combining_no_dedicated_tc_async                  466.45%    71.71ns   13.95M
combining_no_dedicated_tc_async_dup              465.45%    71.86ns   13.92M
----------------------------------------------------------------------------
============================================================================

---------------------------------- Number of threads = 64
============================================================================
folly/experimental/flat_combining/test/FlatCombiningBenchmark.cpprelative  time/iter  iters/s
============================================================================
no_combining_base                                          335.68ns    2.98M
no_combining_dup                                 101.03%   332.25ns    3.01M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_dedicated_notc_sync                    272.91%   123.00ns    8.13M
combining_dedicated_notc_sync_dup                270.56%   124.07ns    8.06M
----------------------------------------------------------------------------
combining_dedicated_notc_async                   200.44%   167.47ns    5.97M
combining_dedicated_notc_async_dup               208.36%   161.10ns    6.21M
----------------------------------------------------------------------------
combining_dedicated_tc_sync                      258.40%   129.91ns    7.70M
combining_dedicated_tc_sync_dup                  249.16%   134.72ns    7.42M
----------------------------------------------------------------------------
combining_dedicated_tc_async                     378.86%    88.60ns   11.29M
combining_dedicated_tc_async_dup                 299.32%   112.15ns    8.92M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_no_dedicated_notc_sync                 272.18%   123.33ns    8.11M
combining_no_dedicated_notc_sync_dup             275.26%   121.95ns    8.20M
----------------------------------------------------------------------------
combining_no_dedicated_notc_async                296.23%   113.32ns    8.82M
combining_no_dedicated_notc_async_dup            311.17%   107.88ns    9.27M
----------------------------------------------------------------------------
combining_no_dedicated_tc_sync                   283.30%   118.49ns    8.44M
combining_no_dedicated_tc_sync_dup               263.86%   127.22ns    7.86M
----------------------------------------------------------------------------
combining_no_dedicated_tc_async                  426.62%    78.68ns   12.71M
combining_no_dedicated_tc_async_dup              445.17%    75.40ns   13.26M
----------------------------------------------------------------------------
============================================================================

------------------------------------ custom interface

---------------------------------- Number of threads = 1
============================================================================
folly/experimental/flat_combining/test/FlatCombiningBenchmark.cpprelative  time/iter  iters/s
============================================================================
no_combining_base                                          329.49ns    3.03M
no_combining_dup                                  99.91%   329.79ns    3.03M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_dedicated_notc_sync                     98.69%   333.88ns    3.00M
combining_dedicated_notc_sync_dup                 98.70%   333.83ns    3.00M
----------------------------------------------------------------------------
combining_dedicated_notc_async                    98.22%   335.47ns    2.98M
combining_dedicated_notc_async_dup                98.16%   335.66ns    2.98M
----------------------------------------------------------------------------
combining_dedicated_tc_sync                       98.70%   333.85ns    3.00M
combining_dedicated_tc_sync_dup                   98.78%   333.58ns    3.00M
----------------------------------------------------------------------------
combining_dedicated_tc_async                      98.14%   335.73ns    2.98M
combining_dedicated_tc_async_dup                  97.92%   336.49ns    2.97M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_no_dedicated_notc_sync                  98.94%   333.00ns    3.00M
combining_no_dedicated_notc_sync_dup              98.86%   333.29ns    3.00M
----------------------------------------------------------------------------
combining_no_dedicated_notc_async                 98.36%   334.99ns    2.99M
combining_no_dedicated_notc_async_dup             98.61%   334.15ns    2.99M
----------------------------------------------------------------------------
combining_no_dedicated_tc_sync                    99.07%   332.58ns    3.01M
combining_no_dedicated_tc_sync_dup                99.12%   332.41ns    3.01M
----------------------------------------------------------------------------
combining_no_dedicated_tc_async                   97.08%   339.38ns    2.95M
combining_no_dedicated_tc_async_dup               97.54%   337.81ns    2.96M
----------------------------------------------------------------------------
============================================================================

---------------------------------- Number of threads = 2
============================================================================
folly/experimental/flat_combining/test/FlatCombiningBenchmark.cpprelative  time/iter  iters/s
============================================================================
no_combining_base                                          216.71ns    4.61M
no_combining_dup                                 100.34%   215.97ns    4.63M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_dedicated_notc_sync                     95.42%   227.11ns    4.40M
combining_dedicated_notc_sync_dup                 94.16%   230.15ns    4.34M
----------------------------------------------------------------------------
combining_dedicated_notc_async                    91.84%   235.97ns    4.24M
combining_dedicated_notc_async_dup                91.41%   237.08ns    4.22M
----------------------------------------------------------------------------
combining_dedicated_tc_sync                       96.79%   223.90ns    4.47M
combining_dedicated_tc_sync_dup                   96.54%   224.47ns    4.45M
----------------------------------------------------------------------------
combining_dedicated_tc_async                      90.90%   238.41ns    4.19M
combining_dedicated_tc_async_dup                  95.45%   227.03ns    4.40M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_no_dedicated_notc_sync                 101.13%   214.28ns    4.67M
combining_no_dedicated_notc_sync_dup             100.11%   216.48ns    4.62M
----------------------------------------------------------------------------
combining_no_dedicated_notc_async                 96.40%   224.80ns    4.45M
combining_no_dedicated_notc_async_dup             96.36%   224.90ns    4.45M
----------------------------------------------------------------------------
combining_no_dedicated_tc_sync                   100.86%   214.85ns    4.65M
combining_no_dedicated_tc_sync_dup               101.91%   212.65ns    4.70M
----------------------------------------------------------------------------
combining_no_dedicated_tc_async                   95.66%   226.54ns    4.41M
combining_no_dedicated_tc_async_dup               95.88%   226.03ns    4.42M
----------------------------------------------------------------------------
============================================================================

---------------------------------- Number of threads = 3
============================================================================
folly/experimental/flat_combining/test/FlatCombiningBenchmark.cpprelative  time/iter  iters/s
============================================================================
no_combining_base                                          189.61ns    5.27M
no_combining_dup                                 100.22%   189.20ns    5.29M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_dedicated_notc_sync                    103.18%   183.76ns    5.44M
combining_dedicated_notc_sync_dup                103.66%   182.92ns    5.47M
----------------------------------------------------------------------------
combining_dedicated_notc_async                    77.14%   245.81ns    4.07M
combining_dedicated_notc_async_dup                90.25%   210.10ns    4.76M
----------------------------------------------------------------------------
combining_dedicated_tc_sync                       89.88%   210.95ns    4.74M
combining_dedicated_tc_sync_dup                   87.83%   215.90ns    4.63M
----------------------------------------------------------------------------
combining_dedicated_tc_async                      89.33%   212.26ns    4.71M
combining_dedicated_tc_async_dup                  85.19%   222.56ns    4.49M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_no_dedicated_notc_sync                  98.43%   192.64ns    5.19M
combining_no_dedicated_notc_sync_dup             101.15%   187.46ns    5.33M
----------------------------------------------------------------------------
combining_no_dedicated_notc_async                 83.77%   226.36ns    4.42M
combining_no_dedicated_notc_async_dup             84.69%   223.89ns    4.47M
----------------------------------------------------------------------------
combining_no_dedicated_tc_sync                    85.47%   221.85ns    4.51M
combining_no_dedicated_tc_sync_dup                86.32%   219.65ns    4.55M
----------------------------------------------------------------------------
combining_no_dedicated_tc_async                  105.62%   179.52ns    5.57M
combining_no_dedicated_tc_async_dup              105.26%   180.14ns    5.55M
----------------------------------------------------------------------------
============================================================================

---------------------------------- Number of threads = 4
============================================================================
folly/experimental/flat_combining/test/FlatCombiningBenchmark.cpprelative  time/iter  iters/s
============================================================================
no_combining_base                                          237.50ns    4.21M
no_combining_dup                                  99.80%   237.97ns    4.20M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_dedicated_notc_sync                    112.56%   210.99ns    4.74M
combining_dedicated_notc_sync_dup                104.08%   228.20ns    4.38M
----------------------------------------------------------------------------
combining_dedicated_notc_async                   101.44%   234.12ns    4.27M
combining_dedicated_notc_async_dup               100.73%   235.77ns    4.24M
----------------------------------------------------------------------------
combining_dedicated_tc_sync                      111.70%   212.62ns    4.70M
combining_dedicated_tc_sync_dup                  113.00%   210.18ns    4.76M
----------------------------------------------------------------------------
combining_dedicated_tc_async                     131.11%   181.15ns    5.52M
combining_dedicated_tc_async_dup                 132.65%   179.04ns    5.59M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_no_dedicated_notc_sync                 115.76%   205.17ns    4.87M
combining_no_dedicated_notc_sync_dup             114.70%   207.06ns    4.83M
----------------------------------------------------------------------------
combining_no_dedicated_notc_async                111.63%   212.76ns    4.70M
combining_no_dedicated_notc_async_dup            111.91%   212.22ns    4.71M
----------------------------------------------------------------------------
combining_no_dedicated_tc_sync                   120.07%   197.80ns    5.06M
combining_no_dedicated_tc_sync_dup               118.25%   200.85ns    4.98M
----------------------------------------------------------------------------
combining_no_dedicated_tc_async                  153.73%   154.49ns    6.47M
combining_no_dedicated_tc_async_dup              153.08%   155.15ns    6.45M
----------------------------------------------------------------------------
============================================================================

---------------------------------- Number of threads = 6
============================================================================
folly/experimental/flat_combining/test/FlatCombiningBenchmark.cpprelative  time/iter  iters/s
============================================================================
no_combining_base                                          281.56ns    3.55M
no_combining_dup                                  99.97%   281.65ns    3.55M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_dedicated_notc_sync                    144.76%   194.50ns    5.14M
combining_dedicated_notc_sync_dup                149.96%   187.76ns    5.33M
----------------------------------------------------------------------------
combining_dedicated_notc_async                   147.72%   190.61ns    5.25M
combining_dedicated_notc_async_dup               140.86%   199.89ns    5.00M
----------------------------------------------------------------------------
combining_dedicated_tc_sync                      154.17%   182.63ns    5.48M
combining_dedicated_tc_sync_dup                  156.60%   179.80ns    5.56M
----------------------------------------------------------------------------
combining_dedicated_tc_async                     202.42%   139.10ns    7.19M
combining_dedicated_tc_async_dup                 203.44%   138.40ns    7.23M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_no_dedicated_notc_sync                 168.33%   167.27ns    5.98M
combining_no_dedicated_notc_sync_dup             166.02%   169.59ns    5.90M
----------------------------------------------------------------------------
combining_no_dedicated_notc_async                166.44%   169.16ns    5.91M
combining_no_dedicated_notc_async_dup            160.14%   175.82ns    5.69M
----------------------------------------------------------------------------
combining_no_dedicated_tc_sync                   181.79%   154.88ns    6.46M
combining_no_dedicated_tc_sync_dup               180.25%   156.20ns    6.40M
----------------------------------------------------------------------------
combining_no_dedicated_tc_async                  240.56%   117.04ns    8.54M
combining_no_dedicated_tc_async_dup              240.74%   116.96ns    8.55M
----------------------------------------------------------------------------
============================================================================

---------------------------------- Number of threads = 8
============================================================================
folly/experimental/flat_combining/test/FlatCombiningBenchmark.cpprelative  time/iter  iters/s
============================================================================
no_combining_base                                          312.99ns    3.19M
no_combining_dup                                  98.93%   316.37ns    3.16M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_dedicated_notc_sync                    182.71%   171.30ns    5.84M
combining_dedicated_notc_sync_dup                183.23%   170.82ns    5.85M
----------------------------------------------------------------------------
combining_dedicated_notc_async                   183.16%   170.88ns    5.85M
combining_dedicated_notc_async_dup               181.29%   172.64ns    5.79M
----------------------------------------------------------------------------
combining_dedicated_tc_sync                      191.49%   163.45ns    6.12M
combining_dedicated_tc_sync_dup                  191.04%   163.84ns    6.10M
----------------------------------------------------------------------------
combining_dedicated_tc_async                     302.89%   103.34ns    9.68M
combining_dedicated_tc_async_dup                 304.07%   102.94ns    9.71M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_no_dedicated_notc_sync                 220.41%   142.00ns    7.04M
combining_no_dedicated_notc_sync_dup             219.90%   142.34ns    7.03M
----------------------------------------------------------------------------
combining_no_dedicated_notc_async                218.66%   143.14ns    6.99M
combining_no_dedicated_notc_async_dup            218.74%   143.09ns    6.99M
----------------------------------------------------------------------------
combining_no_dedicated_tc_sync                   241.82%   129.43ns    7.73M
combining_no_dedicated_tc_sync_dup               241.72%   129.48ns    7.72M
----------------------------------------------------------------------------
combining_no_dedicated_tc_async                  352.39%    88.82ns   11.26M
combining_no_dedicated_tc_async_dup              350.17%    89.38ns   11.19M
----------------------------------------------------------------------------
============================================================================

---------------------------------- Number of threads = 12
============================================================================
folly/experimental/flat_combining/test/FlatCombiningBenchmark.cpprelative  time/iter  iters/s
============================================================================
no_combining_base                                          350.05ns    2.86M
no_combining_dup                                  99.06%   353.37ns    2.83M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_dedicated_notc_sync                    266.87%   131.17ns    7.62M
combining_dedicated_notc_sync_dup                245.79%   142.42ns    7.02M
----------------------------------------------------------------------------
combining_dedicated_notc_async                   238.57%   146.73ns    6.82M
combining_dedicated_notc_async_dup               240.02%   145.84ns    6.86M
----------------------------------------------------------------------------
combining_dedicated_tc_sync                      316.70%   110.53ns    9.05M
combining_dedicated_tc_sync_dup                  321.05%   109.03ns    9.17M
----------------------------------------------------------------------------
combining_dedicated_tc_async                     403.10%    86.84ns   11.52M
combining_dedicated_tc_async_dup                 409.94%    85.39ns   11.71M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_no_dedicated_notc_sync                 300.23%   116.59ns    8.58M
combining_no_dedicated_notc_sync_dup             299.07%   117.04ns    8.54M
----------------------------------------------------------------------------
combining_no_dedicated_notc_async                297.79%   117.55ns    8.51M
combining_no_dedicated_notc_async_dup            296.66%   118.00ns    8.47M
----------------------------------------------------------------------------
combining_no_dedicated_tc_sync                   328.07%   106.70ns    9.37M
combining_no_dedicated_tc_sync_dup               331.52%   105.59ns    9.47M
----------------------------------------------------------------------------
combining_no_dedicated_tc_async                  424.57%    82.45ns   12.13M
combining_no_dedicated_tc_async_dup              409.47%    85.49ns   11.70M
----------------------------------------------------------------------------
============================================================================

---------------------------------- Number of threads = 16
============================================================================
folly/experimental/flat_combining/test/FlatCombiningBenchmark.cpprelative  time/iter  iters/s
============================================================================
no_combining_base                                          360.47ns    2.77M
no_combining_dup                                 100.11%   360.07ns    2.78M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_dedicated_notc_sync                    320.54%   112.46ns    8.89M
combining_dedicated_notc_sync_dup                313.31%   115.05ns    8.69M
----------------------------------------------------------------------------
combining_dedicated_notc_async                   296.83%   121.44ns    8.23M
combining_dedicated_notc_async_dup               289.91%   124.34ns    8.04M
----------------------------------------------------------------------------
combining_dedicated_tc_sync                      364.27%    98.96ns   10.11M
combining_dedicated_tc_sync_dup                  361.10%    99.82ns   10.02M
----------------------------------------------------------------------------
combining_dedicated_tc_async                     424.43%    84.93ns   11.77M
combining_dedicated_tc_async_dup                 418.07%    86.22ns   11.60M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_no_dedicated_notc_sync                 373.13%    96.60ns   10.35M
combining_no_dedicated_notc_sync_dup             364.35%    98.93ns   10.11M
----------------------------------------------------------------------------
combining_no_dedicated_notc_async                361.40%    99.74ns   10.03M
combining_no_dedicated_notc_async_dup            366.49%    98.36ns   10.17M
----------------------------------------------------------------------------
combining_no_dedicated_tc_sync                   382.22%    94.31ns   10.60M
combining_no_dedicated_tc_sync_dup               380.64%    94.70ns   10.56M
----------------------------------------------------------------------------
combining_no_dedicated_tc_async                  461.14%    78.17ns   12.79M
combining_no_dedicated_tc_async_dup              481.50%    74.86ns   13.36M
----------------------------------------------------------------------------
============================================================================

---------------------------------- Number of threads = 24
============================================================================
folly/experimental/flat_combining/test/FlatCombiningBenchmark.cpprelative  time/iter  iters/s
============================================================================
no_combining_base                                          348.97ns    2.87M
no_combining_dup                                 100.12%   348.54ns    2.87M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_dedicated_notc_sync                    234.17%   149.02ns    6.71M
combining_dedicated_notc_sync_dup                205.54%   169.78ns    5.89M
----------------------------------------------------------------------------
combining_dedicated_notc_async                   248.28%   140.55ns    7.11M
combining_dedicated_notc_async_dup               239.71%   145.58ns    6.87M
----------------------------------------------------------------------------
combining_dedicated_tc_sync                      272.87%   127.89ns    7.82M
combining_dedicated_tc_sync_dup                  235.76%   148.02ns    6.76M
----------------------------------------------------------------------------
combining_dedicated_tc_async                     295.71%   118.01ns    8.47M
combining_dedicated_tc_async_dup                 265.87%   131.25ns    7.62M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_no_dedicated_notc_sync                 298.96%   116.73ns    8.57M
combining_no_dedicated_notc_sync_dup             297.67%   117.23ns    8.53M
----------------------------------------------------------------------------
combining_no_dedicated_notc_async                298.44%   116.93ns    8.55M
combining_no_dedicated_notc_async_dup            292.80%   119.18ns    8.39M
----------------------------------------------------------------------------
combining_no_dedicated_tc_sync                   316.44%   110.28ns    9.07M
combining_no_dedicated_tc_sync_dup               317.52%   109.90ns    9.10M
----------------------------------------------------------------------------
combining_no_dedicated_tc_async                  432.64%    80.66ns   12.40M
combining_no_dedicated_tc_async_dup              441.55%    79.03ns   12.65M
----------------------------------------------------------------------------
============================================================================

---------------------------------- Number of threads = 32
============================================================================
folly/experimental/flat_combining/test/FlatCombiningBenchmark.cpprelative  time/iter  iters/s
============================================================================
no_combining_base                                          338.90ns    2.95M
no_combining_dup                                 100.01%   338.87ns    2.95M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_dedicated_notc_sync                    204.34%   165.85ns    6.03M
combining_dedicated_notc_sync_dup                202.84%   167.07ns    5.99M
----------------------------------------------------------------------------
combining_dedicated_notc_async                   192.27%   176.26ns    5.67M
combining_dedicated_notc_async_dup               188.61%   179.68ns    5.57M
----------------------------------------------------------------------------
combining_dedicated_tc_sync                      247.57%   136.89ns    7.31M
combining_dedicated_tc_sync_dup                  285.53%   118.69ns    8.43M
----------------------------------------------------------------------------
combining_dedicated_tc_async                     277.97%   121.92ns    8.20M
combining_dedicated_tc_async_dup                 231.11%   146.64ns    6.82M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_no_dedicated_notc_sync                 299.20%   113.27ns    8.83M
combining_no_dedicated_notc_sync_dup             289.53%   117.05ns    8.54M
----------------------------------------------------------------------------
combining_no_dedicated_notc_async                282.29%   120.05ns    8.33M
combining_no_dedicated_notc_async_dup            305.09%   111.08ns    9.00M
----------------------------------------------------------------------------
combining_no_dedicated_tc_sync                   312.52%   108.44ns    9.22M
combining_no_dedicated_tc_sync_dup               324.88%   104.31ns    9.59M
----------------------------------------------------------------------------
combining_no_dedicated_tc_async                  420.99%    80.50ns   12.42M
combining_no_dedicated_tc_async_dup              406.58%    83.35ns   12.00M
----------------------------------------------------------------------------
============================================================================

---------------------------------- Number of threads = 48
============================================================================
folly/experimental/flat_combining/test/FlatCombiningBenchmark.cpprelative  time/iter  iters/s
============================================================================
no_combining_base                                          334.84ns    2.99M
no_combining_dup                                  99.57%   336.29ns    2.97M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_dedicated_notc_sync                    212.82%   157.34ns    6.36M
combining_dedicated_notc_sync_dup                198.39%   168.78ns    5.93M
----------------------------------------------------------------------------
combining_dedicated_notc_async                   166.74%   200.82ns    4.98M
combining_dedicated_notc_async_dup               197.07%   169.91ns    5.89M
----------------------------------------------------------------------------
combining_dedicated_tc_sync                      246.35%   135.92ns    7.36M
combining_dedicated_tc_sync_dup                  209.52%   159.81ns    6.26M
----------------------------------------------------------------------------
combining_dedicated_tc_async                     293.94%   113.91ns    8.78M
combining_dedicated_tc_async_dup                 280.74%   119.27ns    8.38M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_no_dedicated_notc_sync                 301.60%   111.02ns    9.01M
combining_no_dedicated_notc_sync_dup             296.10%   113.09ns    8.84M
----------------------------------------------------------------------------
combining_no_dedicated_notc_async                308.91%   108.40ns    9.23M
combining_no_dedicated_notc_async_dup            298.48%   112.18ns    8.91M
----------------------------------------------------------------------------
combining_no_dedicated_tc_sync                   331.11%   101.13ns    9.89M
combining_no_dedicated_tc_sync_dup               329.37%   101.66ns    9.84M
----------------------------------------------------------------------------
combining_no_dedicated_tc_async                  451.58%    74.15ns   13.49M
combining_no_dedicated_tc_async_dup              431.37%    77.62ns   12.88M
----------------------------------------------------------------------------
============================================================================

---------------------------------- Number of threads = 64
============================================================================
folly/experimental/flat_combining/test/FlatCombiningBenchmark.cpprelative  time/iter  iters/s
============================================================================
no_combining_base                                          336.22ns    2.97M
no_combining_dup                                 100.69%   333.92ns    2.99M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_dedicated_notc_sync                    230.57%   145.82ns    6.86M
combining_dedicated_notc_sync_dup                221.08%   152.08ns    6.58M
----------------------------------------------------------------------------
combining_dedicated_notc_async                   232.38%   144.69ns    6.91M
combining_dedicated_notc_async_dup               192.77%   174.41ns    5.73M
----------------------------------------------------------------------------
combining_dedicated_tc_sync                      284.07%   118.36ns    8.45M
combining_dedicated_tc_sync_dup                  298.03%   112.81ns    8.86M
----------------------------------------------------------------------------
combining_dedicated_tc_async                     361.07%    93.12ns   10.74M
combining_dedicated_tc_async_dup                 324.11%   103.74ns    9.64M
----------------------------------------------------------------------------
----------------------------------------------------------------------------
combining_no_dedicated_notc_sync                 284.58%   118.15ns    8.46M
combining_no_dedicated_notc_sync_dup             301.73%   111.43ns    8.97M
----------------------------------------------------------------------------
combining_no_dedicated_notc_async                294.87%   114.02ns    8.77M
combining_no_dedicated_notc_async_dup            287.51%   116.94ns    8.55M
----------------------------------------------------------------------------
combining_no_dedicated_tc_sync                   317.96%   105.74ns    9.46M
combining_no_dedicated_tc_sync_dup               332.45%   101.13ns    9.89M
----------------------------------------------------------------------------
combining_no_dedicated_tc_async                  441.96%    76.07ns   13.15M
combining_no_dedicated_tc_async_dup              393.82%    85.37ns   11.71M
----------------------------------------------------------------------------
============================================================================
[       OK ] FlatCombining.folly_benchmark (455269 ms)
[ RUN      ] FlatCombining.direct_measurement

Running benchmarks on machine with 32 logical cores

------------------------------------ custom interface

------------------------------------ Number of threads = 1

Test_name, Max time, Avg time, Min time, % base min / min

no_combining - base             334 ns    331 ns    329 ns
no_combining - dup              335 ns    332 ns    331 ns  99%
---------------------------------------
---- dedicated-------------------------
combining_notc_sync             340 ns    335 ns    332 ns  99%
combining_notc_sync - dup       337 ns    335 ns    333 ns  98%
---------------------------------------
combining_notc_async            360 ns    343 ns    338 ns  97%
combining_notc_async - dup      339 ns    337 ns    336 ns  98%
---------------------------------------
combining_tc_sync               337 ns    335 ns    333 ns  98%
combining_tc_sync - dup         346 ns    336 ns    332 ns  99%
---------------------------------------
combining_tc_async              338 ns    336 ns    335 ns  98%
combining_tc_async - dup        338 ns    336 ns    335 ns  98%
---------------------------------------
---- no dedicated----------------------
combining_notc_sync             338 ns    335 ns    333 ns  98%
combining_notc_sync - dup       337 ns    334 ns    333 ns  98%
---------------------------------------
combining_notc_async            339 ns    336 ns    335 ns  98%
combining_notc_async - dup      347 ns    340 ns    336 ns  98%
---------------------------------------
combining_tc_sync               337 ns    335 ns    333 ns  98%
combining_tc_sync - dup         436 ns    386 ns    333 ns  98%
---------------------------------------
combining_tc_async              340 ns    337 ns    335 ns  98%
combining_tc_async - dup        338 ns    336 ns    335 ns  98%
---------------------------------------

------------------------------------ Number of threads = 2

Test_name, Max time, Avg time, Min time, % base min / min

no_combining - base             315 ns    226 ns    211 ns
no_combining - dup              217 ns    216 ns    213 ns  98%
---------------------------------------
---- dedicated-------------------------
combining_notc_sync             251 ns    237 ns    229 ns  92%
combining_notc_sync - dup       250 ns    241 ns    226 ns  93%
---------------------------------------
combining_notc_async            278 ns    268 ns    252 ns  83%
combining_notc_async - dup      297 ns    263 ns    245 ns  86%
---------------------------------------
combining_tc_sync               254 ns    246 ns    234 ns  90%
combining_tc_sync - dup         335 ns    252 ns    230 ns  91%
---------------------------------------
combining_tc_async              305 ns    282 ns    245 ns  86%
combining_tc_async - dup        284 ns    256 ns    239 ns  88%
---------------------------------------
---- no dedicated----------------------
combining_notc_sync             230 ns    222 ns    217 ns  97%
combining_notc_sync - dup       231 ns    225 ns    218 ns  96%
---------------------------------------
combining_notc_async            244 ns    238 ns    233 ns  90%
combining_notc_async - dup      241 ns    236 ns    231 ns  91%
---------------------------------------
combining_tc_sync               283 ns    239 ns    221 ns  95%
combining_tc_sync - dup         299 ns    247 ns    225 ns  93%
---------------------------------------
combining_tc_async              290 ns    270 ns    244 ns  86%
combining_tc_async - dup        290 ns    251 ns    238 ns  88%
---------------------------------------

------------------------------------ Number of threads = 3

Test_name, Max time, Avg time, Min time, % base min / min

no_combining - base             211 ns    197 ns    190 ns
no_combining - dup              209 ns    201 ns    195 ns  97%
---------------------------------------
---- dedicated-------------------------
combining_notc_sync             258 ns    197 ns    168 ns 112%
combining_notc_sync - dup       274 ns    200 ns    162 ns 117%
---------------------------------------
combining_notc_async            307 ns    281 ns    260 ns  73%
combining_notc_async - dup      284 ns    258 ns    216 ns  88%
---------------------------------------
combining_tc_sync               228 ns    215 ns    192 ns  98%
combining_tc_sync - dup         216 ns    203 ns    178 ns 107%
---------------------------------------
combining_tc_async              246 ns    233 ns    220 ns  86%
combining_tc_async - dup        236 ns    221 ns    208 ns  91%
---------------------------------------
---- no dedicated----------------------
combining_notc_sync             204 ns    198 ns    184 ns 103%
combining_notc_sync - dup       203 ns    198 ns    193 ns  98%
---------------------------------------
combining_notc_async            238 ns    225 ns    218 ns  87%
combining_notc_async - dup      231 ns    227 ns    223 ns  85%
---------------------------------------
combining_tc_sync               220 ns    216 ns    211 ns  90%
combining_tc_sync - dup         227 ns    223 ns    219 ns  87%
---------------------------------------
combining_tc_async              182 ns    181 ns    179 ns 106%
combining_tc_async - dup        186 ns    181 ns    180 ns 105%
---------------------------------------

------------------------------------ Number of threads = 4

Test_name, Max time, Avg time, Min time, % base min / min

no_combining - base             258 ns    245 ns    238 ns
no_combining - dup              262 ns    249 ns    245 ns  97%
---------------------------------------
---- dedicated-------------------------
combining_notc_sync             264 ns    250 ns    220 ns 107%
combining_notc_sync - dup       260 ns    254 ns    231 ns 102%
---------------------------------------
combining_notc_async            266 ns    255 ns    233 ns 102%
combining_notc_async - dup      268 ns    260 ns    252 ns  94%
---------------------------------------
combining_tc_sync               250 ns    240 ns    215 ns 110%
combining_tc_sync - dup         252 ns    242 ns    217 ns 109%
---------------------------------------
combining_tc_async              199 ns    190 ns    183 ns 129%
combining_tc_async - dup        199 ns    189 ns    178 ns 133%
---------------------------------------
---- no dedicated----------------------
combining_notc_sync             223 ns    211 ns    203 ns 116%
combining_notc_sync - dup       218 ns    211 ns    202 ns 117%
---------------------------------------
combining_notc_async            222 ns    213 ns    207 ns 114%
combining_notc_async - dup      236 ns    222 ns    215 ns 110%
---------------------------------------
combining_tc_sync               202 ns    199 ns    197 ns 120%
combining_tc_sync - dup         207 ns    199 ns    194 ns 122%
---------------------------------------
combining_tc_async              162 ns    157 ns    152 ns 155%
combining_tc_async - dup        188 ns    161 ns    154 ns 154%
---------------------------------------

------------------------------------ Number of threads = 6

Test_name, Max time, Avg time, Min time, % base min / min

no_combining - base             298 ns    292 ns    281 ns
no_combining - dup              296 ns    289 ns    270 ns 104%
---------------------------------------
---- dedicated-------------------------
combining_notc_sync             221 ns    211 ns    196 ns 143%
combining_notc_sync - dup       247 ns    211 ns    192 ns 146%
---------------------------------------
combining_notc_async            216 ns    205 ns    194 ns 144%
combining_notc_async - dup      215 ns    206 ns    197 ns 142%
---------------------------------------
combining_tc_sync               225 ns    204 ns    185 ns 151%
combining_tc_sync - dup         229 ns    210 ns    186 ns 151%
---------------------------------------
combining_tc_async              165 ns    152 ns    144 ns 194%
combining_tc_async - dup        166 ns    150 ns    143 ns 195%
---------------------------------------
---- no dedicated----------------------
combining_notc_sync             184 ns    182 ns    180 ns 155%
combining_notc_sync - dup       176 ns    174 ns    172 ns 163%
---------------------------------------
combining_notc_async            179 ns    177 ns    174 ns 161%
combining_notc_async - dup      186 ns    181 ns    177 ns 158%
---------------------------------------
combining_tc_sync               164 ns    163 ns    160 ns 174%
combining_tc_sync - dup         171 ns    168 ns    161 ns 173%
---------------------------------------
combining_tc_async              142 ns    139 ns    138 ns 202%
combining_tc_async - dup        141 ns    136 ns    119 ns 235%
---------------------------------------

------------------------------------ Number of threads = 8

Test_name, Max time, Avg time, Min time, % base min / min

no_combining - base             333 ns    328 ns    315 ns
no_combining - dup              336 ns    330 ns    327 ns  96%
---------------------------------------
---- dedicated-------------------------
combining_notc_sync             203 ns    179 ns    172 ns 183%
combining_notc_sync - dup       190 ns    177 ns    171 ns 183%
---------------------------------------
combining_notc_async            204 ns    183 ns    170 ns 185%
combining_notc_async - dup      201 ns    187 ns    176 ns 179%
---------------------------------------
combining_tc_sync               177 ns    170 ns    165 ns 190%
combining_tc_sync - dup         178 ns    167 ns    164 ns 192%
---------------------------------------
combining_tc_async              134 ns    115 ns    105 ns 300%
combining_tc_async - dup        132 ns    115 ns    103 ns 304%
---------------------------------------
---- no dedicated----------------------
combining_notc_sync             154 ns    145 ns    143 ns 220%
combining_notc_sync - dup       153 ns    144 ns    142 ns 222%
---------------------------------------
combining_notc_async            145 ns    144 ns    143 ns 219%
combining_notc_async - dup      157 ns    148 ns    144 ns 218%
---------------------------------------
combining_tc_sync               142 ns    134 ns    130 ns 241%
combining_tc_sync - dup         144 ns    136 ns    130 ns 241%
---------------------------------------
combining_tc_async              118 ns     99 ns     91 ns 344%
combining_tc_async - dup        118 ns     95 ns     91 ns 344%
---------------------------------------

------------------------------------ Number of threads = 12

Test_name, Max time, Avg time, Min time, % base min / min

no_combining - base             361 ns    357 ns    353 ns
no_combining - dup              361 ns    357 ns    355 ns  99%
---------------------------------------
---- dedicated-------------------------
combining_notc_sync             190 ns    157 ns    138 ns 255%
combining_notc_sync - dup       162 ns    149 ns    138 ns 255%
---------------------------------------
combining_notc_async            163 ns    153 ns    145 ns 242%
combining_notc_async - dup      194 ns    158 ns    152 ns 231%
---------------------------------------
combining_tc_sync               181 ns    128 ns    111 ns 316%
combining_tc_sync - dup         183 ns    148 ns    121 ns 289%
---------------------------------------
combining_tc_async               92 ns     89 ns     87 ns 402%
combining_tc_async - dup        152 ns    105 ns     87 ns 405%
---------------------------------------
---- no dedicated----------------------
combining_notc_sync             120 ns    119 ns    118 ns 298%
combining_notc_sync - dup       120 ns    119 ns    118 ns 298%
---------------------------------------
combining_notc_async            122 ns    120 ns    120 ns 294%
combining_notc_async - dup      121 ns    120 ns    118 ns 297%
---------------------------------------
combining_tc_sync               110 ns    108 ns    106 ns 331%
combining_tc_sync - dup         110 ns    109 ns    107 ns 327%
---------------------------------------
combining_tc_async               88 ns     87 ns     85 ns 411%
combining_tc_async - dup         90 ns     88 ns     85 ns 411%
---------------------------------------

------------------------------------ Number of threads = 16

Test_name, Max time, Avg time, Min time, % base min / min

no_combining - base             363 ns    361 ns    360 ns
no_combining - dup              362 ns    361 ns    358 ns 100%
---------------------------------------
---- dedicated-------------------------
combining_notc_sync             177 ns    136 ns    111 ns 323%
combining_notc_sync - dup       185 ns    148 ns    112 ns 320%
---------------------------------------
combining_notc_async            191 ns    151 ns    122 ns 294%
combining_notc_async - dup      179 ns    157 ns    118 ns 305%
---------------------------------------
combining_tc_sync               154 ns    125 ns    100 ns 360%
combining_tc_sync - dup         166 ns    130 ns     98 ns 367%
---------------------------------------
combining_tc_async              143 ns    107 ns     86 ns 418%
combining_tc_async - dup        132 ns    112 ns     88 ns 407%
---------------------------------------
---- no dedicated----------------------
combining_notc_sync             121 ns    103 ns     98 ns 367%
combining_notc_sync - dup       117 ns    104 ns     99 ns 362%
---------------------------------------
combining_notc_async            116 ns    105 ns     99 ns 363%
combining_notc_async - dup      112 ns    104 ns    100 ns 359%
---------------------------------------
combining_tc_sync               111 ns    101 ns     94 ns 381%
combining_tc_sync - dup         113 ns     98 ns     93 ns 387%
---------------------------------------
combining_tc_async               97 ns     85 ns     74 ns 484%
combining_tc_async - dup         98 ns     86 ns     78 ns 457%
---------------------------------------

------------------------------------ Number of threads = 24

Test_name, Max time, Avg time, Min time, % base min / min

no_combining - base             352 ns    351 ns    349 ns
no_combining - dup              352 ns    351 ns    348 ns 100%
---------------------------------------
---- dedicated-------------------------
combining_notc_sync             214 ns    173 ns    149 ns 234%
combining_notc_sync - dup       212 ns    166 ns    137 ns 254%
---------------------------------------
combining_notc_async            232 ns    198 ns    161 ns 216%
combining_notc_async - dup      225 ns    191 ns    149 ns 234%
---------------------------------------
combining_tc_sync               192 ns    152 ns    129 ns 270%
combining_tc_sync - dup         176 ns    156 ns    121 ns 286%
---------------------------------------
combining_tc_async              202 ns    147 ns    118 ns 296%
combining_tc_async - dup        200 ns    158 ns    120 ns 291%
---------------------------------------
---- no dedicated----------------------
combining_notc_sync             161 ns    125 ns    115 ns 303%
combining_notc_sync - dup       144 ns    127 ns    116 ns 299%
---------------------------------------
combining_notc_async            135 ns    122 ns    116 ns 298%
combining_notc_async - dup      341 ns    148 ns    117 ns 298%
---------------------------------------
combining_tc_sync               130 ns    118 ns    109 ns 319%
combining_tc_sync - dup         116 ns    110 ns    105 ns 332%
---------------------------------------
combining_tc_async               97 ns     86 ns     79 ns 442%
combining_tc_async - dup         95 ns     86 ns     79 ns 440%
---------------------------------------

------------------------------------ Number of threads = 32

Test_name, Max time, Avg time, Min time, % base min / min

no_combining - base             337 ns    336 ns    333 ns
no_combining - dup              338 ns    336 ns    333 ns  99%
---------------------------------------
---- dedicated-------------------------
combining_notc_sync             193 ns    177 ns    162 ns 204%
combining_notc_sync - dup       211 ns    181 ns    156 ns 213%
---------------------------------------
combining_notc_async            245 ns    200 ns    162 ns 205%
combining_notc_async - dup      216 ns    197 ns    149 ns 223%
---------------------------------------
combining_tc_sync               195 ns    167 ns    121 ns 274%
combining_tc_sync - dup         179 ns    164 ns    143 ns 231%
---------------------------------------
combining_tc_async              187 ns    152 ns    108 ns 307%
combining_tc_async - dup        182 ns    151 ns    125 ns 266%
---------------------------------------
---- no dedicated----------------------
combining_notc_sync             189 ns    127 ns    114 ns 290%
combining_notc_sync - dup       126 ns    118 ns    110 ns 302%
---------------------------------------
combining_notc_async            233 ns    129 ns    112 ns 297%
combining_notc_async - dup      170 ns    126 ns    113 ns 293%
---------------------------------------
combining_tc_sync               948 ns    212 ns    107 ns 309%
combining_tc_sync - dup         137 ns    112 ns    104 ns 318%
---------------------------------------
combining_tc_async               90 ns     86 ns     79 ns 421%
combining_tc_async - dup         94 ns     87 ns     80 ns 414%
---------------------------------------

------------------------------------ Number of threads = 48

Test_name, Max time, Avg time, Min time, % base min / min

no_combining - base             340 ns    336 ns    334 ns
no_combining - dup              336 ns    335 ns    334 ns 100%
---------------------------------------
---- dedicated-------------------------
combining_notc_sync             214 ns    176 ns    137 ns 243%
combining_notc_sync - dup       210 ns    173 ns    128 ns 260%
---------------------------------------
combining_notc_async            217 ns    186 ns    162 ns 205%
combining_notc_async - dup      215 ns    186 ns    149 ns 224%
---------------------------------------
combining_tc_sync               206 ns    171 ns    145 ns 230%
combining_tc_sync - dup         179 ns    149 ns    126 ns 265%
---------------------------------------
combining_tc_async              175 ns    138 ns    108 ns 309%
combining_tc_async - dup        169 ns    134 ns    110 ns 301%
---------------------------------------
---- no dedicated----------------------
combining_notc_sync            1798 ns    293 ns    118 ns 282%
combining_notc_sync - dup       171 ns    122 ns    105 ns 318%
---------------------------------------
combining_notc_async            227 ns    132 ns    110 ns 302%
combining_notc_async - dup      226 ns    137 ns    111 ns 301%
---------------------------------------
combining_tc_sync               111 ns    106 ns    102 ns 327%
combining_tc_sync - dup         127 ns    110 ns    104 ns 321%
---------------------------------------
combining_tc_async              297 ns    117 ns     77 ns 433%
combining_tc_async - dup        742 ns    149 ns     77 ns 432%
---------------------------------------

------------------------------------ Number of threads = 64

Test_name, Max time, Avg time, Min time, % base min / min

no_combining - base             338 ns    333 ns    331 ns
no_combining - dup              335 ns    333 ns    331 ns  99%
---------------------------------------
---- dedicated-------------------------
combining_notc_sync             198 ns    163 ns    148 ns 223%
combining_notc_sync - dup       172 ns    154 ns    124 ns 266%
---------------------------------------
combining_notc_async            211 ns    177 ns    158 ns 209%
combining_notc_async - dup      182 ns    166 ns    152 ns 216%
---------------------------------------
combining_tc_sync               195 ns    133 ns    112 ns 294%
combining_tc_sync - dup         158 ns    135 ns    108 ns 305%
---------------------------------------
combining_tc_async              145 ns    119 ns     95 ns 347%
combining_tc_async - dup        159 ns    130 ns     95 ns 346%
---------------------------------------
---- no dedicated----------------------
combining_notc_sync             188 ns    123 ns    107 ns 308%
combining_notc_sync - dup       546 ns    159 ns    107 ns 307%
---------------------------------------
combining_notc_async            558 ns    160 ns    108 ns 304%
combining_notc_async - dup      192 ns    127 ns    107 ns 308%
---------------------------------------
combining_tc_sync               325 ns    130 ns    101 ns 325%
combining_tc_sync - dup        1766 ns    273 ns    101 ns 325%
---------------------------------------
combining_tc_async              417 ns    118 ns     74 ns 446%
combining_tc_async - dup        838 ns    212 ns     72 ns 455%
---------------------------------------
[       OK ] FlatCombining.direct_measurement (178622 ms)
[----------] 2 tests from FlatCombining (633891 ms total)

[----------] Global test environment tear-down
[==========] 2 tests from 1 test case ran. (633891 ms total)
[  PASSED  ] 2 tests.

---

$ lscpu

Architecture:          x86_64
CPU op-mode(s):        32-bit, 64-bit
Byte Order:            Little Endian
CPU(s):                32
On-line CPU(s) list:   0-31
Thread(s) per core:    2
Core(s) per socket:    8
Socket(s):             2
NUMA node(s):          2
Vendor ID:             GenuineIntel
CPU family:            6
Model:                 45
Model name:            Intel(R) Xeon(R) CPU E5-2660 0 @ 2.20GHz
Stepping:              6
CPU MHz:               2200.000
CPU max MHz:           2200.0000
CPU min MHz:           1200.0000
BogoMIPS:              4399.87
Virtualization:        VT-x
L1d cache:             32K
L1i cache:             32K
L2 cache:              256K
L3 cache:              20480K
NUMA node0 CPU(s):     0-7,16-23
NUMA node1 CPU(s):     8-15,24-31

Flags:                 fpu vme de pse tsc msr pae mce cx8 apic sep
mtrr pge mca cmov pat pse36 clflush dts acpi mmx fxsr sse sse2 ss ht
tm pbe syscall nx pdpe1gb rdtscp lm constant_tsc arch_perfmon pebs bts
rep_good nopl xtopology nonstop_tsc aperfmperf eagerfpu pni pclmulqdq
dtes64 monitor ds_cpl vmx smx est tm2 ssse3 cx16 xtpr pdcm pcid dca
sse4_1 sse4_2 x2apic popcnt tsc_deadline_timer aes xsave avx lahf_lm
epb tpr_shadow vnmi flexpriority ept vpid xsaveopt dtherm arat pln pts

---

 */
// clang-format on
