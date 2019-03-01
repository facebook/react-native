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

#include <folly/Math.h>

#include <algorithm>
#include <random>

#include <folly/Benchmark.h>

namespace {
template <typename T>
T brokenButWidespreadDivCeil(T num, T denom) {
  return (num + denom - 1) / denom;
}

template <typename T>
T viaFloatDivCeil(T num, T denom) {
  return static_cast<T>(ceilf(static_cast<float>(num) / denom));
}

template <typename T>
T viaDoubleDivCeil(T num, T denom) {
  return static_cast<T>(ceil(static_cast<double>(num) / denom));
}

template <typename T>
T viaLongDoubleDivCeil(T num, T denom) {
  return static_cast<T>(ceill(static_cast<long double>(num) / denom));
}

template <typename T>
std::vector<T> divValues() {
  std::vector<T> rv;
  for (T i = 1; i < std::numeric_limits<T>::max() && i <= 1000; ++i) {
    rv.push_back(i);
    rv.push_back(-i);
    rv.push_back(std::numeric_limits<T>::max() / i);
    auto x = std::numeric_limits<T>::min() / i;
    if (x != 0) {
      rv.push_back(x);
    }
  }
  return rv;
}

template <typename T, typename F>
void runDivTests(const F& func, size_t iters) {
  std::vector<T> denoms;
  std::vector<T> numers;
  BENCHMARK_SUSPEND {
    denoms = divValues<T>();
    numers = denoms;
    numers.push_back(0);
    std::mt19937 rnd(1234);
    std::shuffle(denoms.begin(), denoms.end(), rnd);
    std::shuffle(numers.begin(), numers.end(), rnd);
  }
  T dep = 0;
  while (true) {
    for (T d : denoms) {
      for (T n : numers) {
        n ^= dep;
        if (std::is_signed<T>::value && n == std::numeric_limits<T>::min() &&
            d == -1) {
          // min / -1 overflows in two's complement
          d = -2;
        }
        dep = func(n, d);

        if (--iters == 0) {
          folly::doNotOptimizeAway(dep);
          return;
        }
      }
    }
  }
}
}

BENCHMARK_DRAW_LINE();
BENCHMARK(divTruncInt8, iters) {
  runDivTests<int8_t>(&folly::divTrunc<int8_t, int8_t>, iters);
}
BENCHMARK(divFloorInt8, iters) {
  runDivTests<int8_t>(&folly::divFloor<int8_t, int8_t>, iters);
}
BENCHMARK(divCeilInt8, iters) {
  runDivTests<int8_t>(&folly::divCeil<int8_t, int8_t>, iters);
}
BENCHMARK_RELATIVE(branchlessDivCeilInt8, iters) {
  runDivTests<int8_t>(&folly::detail::divCeilBranchless<int8_t>, iters);
}
BENCHMARK_RELATIVE(branchfulDivCeilInt8, iters) {
  runDivTests<int8_t>(&folly::detail::divCeilBranchful<int8_t>, iters);
}
BENCHMARK_RELATIVE(brokenButWidespreadDivCeilInt8, iters) {
  runDivTests<int8_t>(&brokenButWidespreadDivCeil<int8_t>, iters);
}
BENCHMARK_RELATIVE(viaFloatDivCeilInt8, iters) {
  runDivTests<int8_t>(&viaFloatDivCeil<int8_t>, iters);
}
BENCHMARK_RELATIVE(viaDoubleDivCeilInt8, iters) {
  runDivTests<int8_t>(&viaDoubleDivCeil<int8_t>, iters);
}
BENCHMARK_RELATIVE(viaLongDoubleDivCeilInt8, iters) {
  runDivTests<int8_t>(&viaLongDoubleDivCeil<int8_t>, iters);
}
BENCHMARK(divRoundAwayInt8, iters) {
  runDivTests<int8_t>(&folly::divRoundAway<int8_t, int8_t>, iters);
}

BENCHMARK_DRAW_LINE();
BENCHMARK(divTruncInt16, iters) {
  runDivTests<int16_t>(&folly::divTrunc<int16_t, int16_t>, iters);
}
BENCHMARK(divFloorInt16, iters) {
  runDivTests<int16_t>(&folly::divFloor<int16_t, int16_t>, iters);
}
BENCHMARK(divCeilInt16, iters) {
  runDivTests<int16_t>(&folly::divCeil<int16_t, int16_t>, iters);
}
BENCHMARK_RELATIVE(branchlessDivCeilInt16, iters) {
  runDivTests<int16_t>(&folly::detail::divCeilBranchless<int16_t>, iters);
}
BENCHMARK_RELATIVE(branchfulDivCeilInt16, iters) {
  runDivTests<int16_t>(&folly::detail::divCeilBranchful<int16_t>, iters);
}
BENCHMARK_RELATIVE(brokenButWidespreadDivCeilInt16, iters) {
  runDivTests<int16_t>(&brokenButWidespreadDivCeil<int16_t>, iters);
}
BENCHMARK_RELATIVE(viaFloatDivCeilInt16, iters) {
  runDivTests<int16_t>(&viaFloatDivCeil<int16_t>, iters);
}
BENCHMARK_RELATIVE(viaDoubleDivCeilInt16, iters) {
  runDivTests<int16_t>(&viaDoubleDivCeil<int16_t>, iters);
}
BENCHMARK_RELATIVE(viaLongDoubleDivCeilInt16, iters) {
  runDivTests<int16_t>(&viaLongDoubleDivCeil<int16_t>, iters);
}
BENCHMARK(divRoundAwayInt16, iters) {
  runDivTests<int16_t>(&folly::divRoundAway<int16_t, int16_t>, iters);
}

BENCHMARK_DRAW_LINE();
BENCHMARK(divTruncInt32, iters) {
  runDivTests<int32_t>(&folly::divTrunc<int32_t, int32_t>, iters);
}
BENCHMARK(divFloorInt32, iters) {
  runDivTests<int32_t>(&folly::divFloor<int32_t, int32_t>, iters);
}
BENCHMARK(divCeilInt32, iters) {
  runDivTests<int32_t>(&folly::divCeil<int32_t, int32_t>, iters);
}
BENCHMARK_RELATIVE(branchlessDivCeilInt32, iters) {
  runDivTests<int32_t>(&folly::detail::divCeilBranchless<int32_t>, iters);
}
BENCHMARK_RELATIVE(branchfulDivCeilInt32, iters) {
  runDivTests<int32_t>(&folly::detail::divCeilBranchful<int32_t>, iters);
}
BENCHMARK_RELATIVE(brokenButWidespreadDivCeilInt32, iters) {
  runDivTests<int32_t>(&brokenButWidespreadDivCeil<int32_t>, iters);
}
BENCHMARK_RELATIVE(approxViaFloatDivCeilInt32, iters) {
  runDivTests<int32_t>(&viaFloatDivCeil<int32_t>, iters);
}
BENCHMARK_RELATIVE(viaDoubleDivCeilInt32, iters) {
  runDivTests<int32_t>(&viaDoubleDivCeil<int32_t>, iters);
}
BENCHMARK_RELATIVE(viaLongDoubleDivCeilInt32, iters) {
  runDivTests<int32_t>(&viaLongDoubleDivCeil<int32_t>, iters);
}
BENCHMARK(divRoundAwayInt32, iters) {
  runDivTests<int32_t>(&folly::divRoundAway<int32_t, int32_t>, iters);
}

BENCHMARK_DRAW_LINE();
BENCHMARK(divTruncInt64, iters) {
  runDivTests<int64_t>(&folly::divTrunc<int64_t, int64_t>, iters);
}
BENCHMARK(divFloorInt64, iters) {
  runDivTests<int64_t>(&folly::divFloor<int64_t, int64_t>, iters);
}
BENCHMARK(divCeilInt64, iters) {
  runDivTests<int64_t>(&folly::divCeil<int64_t, int64_t>, iters);
}
BENCHMARK_RELATIVE(branchlessDivCeilInt64, iters) {
  runDivTests<int64_t>(&folly::detail::divCeilBranchless<int64_t>, iters);
}
BENCHMARK_RELATIVE(branchfulDivCeilInt64, iters) {
  runDivTests<int64_t>(&folly::detail::divCeilBranchful<int64_t>, iters);
}
BENCHMARK_RELATIVE(brokenButWidespreadDivCeilInt64, iters) {
  runDivTests<int64_t>(&brokenButWidespreadDivCeil<int64_t>, iters);
}
BENCHMARK_RELATIVE(approxViaFloatDivCeilInt64, iters) {
  runDivTests<int64_t>(&viaFloatDivCeil<int64_t>, iters);
}
BENCHMARK_RELATIVE(approxViaDoubleDivCeilInt64, iters) {
  runDivTests<int64_t>(&viaDoubleDivCeil<int64_t>, iters);
}
BENCHMARK_RELATIVE(viaLongDoubleDivCeilInt64, iters) {
  runDivTests<int64_t>(&viaLongDoubleDivCeil<int64_t>, iters);
}
BENCHMARK(divRoundAwayInt64, iters) {
  runDivTests<int64_t>(&folly::divRoundAway<int64_t, int64_t>, iters);
}

BENCHMARK_DRAW_LINE();
BENCHMARK(divTruncUint8, iters) {
  runDivTests<uint8_t>(&folly::divTrunc<uint8_t, uint8_t>, iters);
}
BENCHMARK(divFloorUint8, iters) {
  runDivTests<uint8_t>(&folly::divFloor<uint8_t, uint8_t>, iters);
}
BENCHMARK(divCeilUint8, iters) {
  runDivTests<uint8_t>(&folly::divCeil<uint8_t, uint8_t>, iters);
}
BENCHMARK_RELATIVE(branchlessDivCeilUint8, iters) {
  runDivTests<uint8_t>(&folly::detail::divCeilBranchless<uint8_t>, iters);
}
BENCHMARK_RELATIVE(branchfulDivCeilUint8, iters) {
  runDivTests<uint8_t>(&folly::detail::divCeilBranchful<uint8_t>, iters);
}
BENCHMARK_RELATIVE(brokenButWidespreadDivCeilUint8, iters) {
  runDivTests<uint8_t>(&brokenButWidespreadDivCeil<uint8_t>, iters);
}
BENCHMARK_RELATIVE(viaFloatDivCeilUint8, iters) {
  runDivTests<uint8_t>(&viaFloatDivCeil<uint8_t>, iters);
}
BENCHMARK_RELATIVE(viaDoubleDivCeilUint8, iters) {
  runDivTests<uint8_t>(&viaDoubleDivCeil<uint8_t>, iters);
}
BENCHMARK_RELATIVE(viaLongDoubleDivCeilUint8, iters) {
  runDivTests<uint8_t>(&viaLongDoubleDivCeil<uint8_t>, iters);
}
BENCHMARK(divRoundAwayUint8, iters) {
  runDivTests<uint8_t>(&folly::divRoundAway<uint8_t, uint8_t>, iters);
}

BENCHMARK_DRAW_LINE();
BENCHMARK(divTruncUint16, iters) {
  runDivTests<uint16_t>(&folly::divTrunc<uint16_t, uint16_t>, iters);
}
BENCHMARK(divFloorUint16, iters) {
  runDivTests<uint16_t>(&folly::divFloor<uint16_t, uint16_t>, iters);
}
BENCHMARK(divCeilUint16, iters) {
  runDivTests<uint16_t>(&folly::divCeil<uint16_t, uint16_t>, iters);
}
BENCHMARK_RELATIVE(branchlessDivCeilUint16, iters) {
  runDivTests<uint16_t>(&folly::detail::divCeilBranchless<uint16_t>, iters);
}
BENCHMARK_RELATIVE(branchfulDivCeilUint16, iters) {
  runDivTests<uint16_t>(&folly::detail::divCeilBranchful<uint16_t>, iters);
}
BENCHMARK_RELATIVE(brokenButWidespreadDivCeilUint16, iters) {
  runDivTests<uint16_t>(&brokenButWidespreadDivCeil<uint16_t>, iters);
}
BENCHMARK_RELATIVE(viaFloatDivCeilUint16, iters) {
  runDivTests<uint16_t>(&viaFloatDivCeil<uint16_t>, iters);
}
BENCHMARK_RELATIVE(viaDoubleDivCeilUint16, iters) {
  runDivTests<uint16_t>(&viaDoubleDivCeil<uint16_t>, iters);
}
BENCHMARK_RELATIVE(viaLongDoubleDivCeilUint16, iters) {
  runDivTests<uint16_t>(&viaLongDoubleDivCeil<uint16_t>, iters);
}
BENCHMARK(divRoundAwayUint16, iters) {
  runDivTests<uint16_t>(&folly::divRoundAway<uint16_t, uint16_t>, iters);
}

BENCHMARK_DRAW_LINE();
BENCHMARK(divTruncUint32, iters) {
  runDivTests<uint32_t>(&folly::divTrunc<uint32_t, uint32_t>, iters);
}
BENCHMARK(divFloorUint32, iters) {
  runDivTests<uint32_t>(&folly::divFloor<uint32_t, uint32_t>, iters);
}
BENCHMARK(divCeilUint32, iters) {
  runDivTests<uint32_t>(&folly::divCeil<uint32_t, uint32_t>, iters);
}
BENCHMARK_RELATIVE(branchlessDivCeilUint32, iters) {
  runDivTests<uint32_t>(&folly::detail::divCeilBranchless<uint32_t>, iters);
}
BENCHMARK_RELATIVE(branchfulDivCeilUint32, iters) {
  runDivTests<uint32_t>(&folly::detail::divCeilBranchful<uint32_t>, iters);
}
BENCHMARK_RELATIVE(brokenButWidespreadDivCeilUint32, iters) {
  runDivTests<uint32_t>(&brokenButWidespreadDivCeil<uint32_t>, iters);
}
BENCHMARK_RELATIVE(approxViaFloatDivCeilUint32, iters) {
  runDivTests<uint32_t>(&viaFloatDivCeil<uint32_t>, iters);
}
BENCHMARK_RELATIVE(viaDoubleDivCeilUint32, iters) {
  runDivTests<uint32_t>(&viaDoubleDivCeil<uint32_t>, iters);
}
BENCHMARK_RELATIVE(viaLongDoubleDivCeilUint32, iters) {
  runDivTests<uint32_t>(&viaLongDoubleDivCeil<uint32_t>, iters);
}
BENCHMARK(divRoundAwayUint32, iters) {
  runDivTests<uint32_t>(&folly::divRoundAway<uint32_t, uint32_t>, iters);
}

BENCHMARK_DRAW_LINE();
BENCHMARK(divTruncUint64, iters) {
  runDivTests<uint64_t>(&folly::divTrunc<uint64_t, uint64_t>, iters);
}
BENCHMARK(divFloorUint64, iters) {
  runDivTests<uint64_t>(&folly::divFloor<uint64_t, uint64_t>, iters);
}
BENCHMARK(divCeilUint64, iters) {
  runDivTests<uint64_t>(&folly::divCeil<uint64_t, uint64_t>, iters);
}
BENCHMARK_RELATIVE(branchlessDivCeilUint64, iters) {
  runDivTests<uint64_t>(&folly::detail::divCeilBranchless<uint64_t>, iters);
}
BENCHMARK_RELATIVE(branchfulDivCeilUint64, iters) {
  runDivTests<uint64_t>(&folly::detail::divCeilBranchful<uint64_t>, iters);
}
BENCHMARK_RELATIVE(brokenButWidespreadDivCeilUint64, iters) {
  runDivTests<uint64_t>(&brokenButWidespreadDivCeil<uint64_t>, iters);
}
BENCHMARK_RELATIVE(approxViaFloatDivCeilUint64, iters) {
  runDivTests<uint64_t>(&viaFloatDivCeil<uint64_t>, iters);
}
BENCHMARK_RELATIVE(approxViaDoubleDivCeilUint64, iters) {
  runDivTests<uint64_t>(&viaDoubleDivCeil<uint64_t>, iters);
}
BENCHMARK_RELATIVE(viaLongDoubleDivCeilUint64, iters) {
  runDivTests<uint64_t>(&viaLongDoubleDivCeil<uint64_t>, iters);
}
BENCHMARK(divRoundAwayUint64, iters) {
  runDivTests<uint64_t>(&folly::divRoundAway<uint64_t, uint64_t>, iters);
}

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
  return 0;
}

/*
Benchmarks run single-threaded on a dual Xeon E5-2660 @ 2.2 Ghz with
hyperthreading (16 physical cores, 20 MB cache per socket, 256 GB RAM)

Benchmarks used --bm_min_iters=10000000.

divTrunc is just a native integral division.  viaDoubleViaCeil doesn't
have full accuracy for Int64 or Uint64.  There is a loop-carried
dependency for all of the div* tests, but there is a bit of extra slack
(a predictable call, a load that should be from the L1, and a predictable
not-taken branch in addition to the loop's branch) in the driving loop,
so the benchmark driver's attempt to subtract the overhead of the loop
might mean that the latency numbers here are slightly too low or too high.

The branchful implementation's branch is very predictable in this
microbenchmark for unsigned types, since it only needs to predict a
zero numerator.  That's likely to be true in real life as well, so we
make this the default.

I was surprised at the speed of float and double division, but
the only case where it actually wins by much and is correct is for
int16_t.  (float + ceil is faster for the 32-bit case, but is only
an approximation.)  I ran a similar benchmark setup for ARM and ARM64.
On ARM the conditional versions win by quite a bit.  32-bit ARM doesn't
have a native integer divide, so getting the remainder after a division
(to see if truncation occurred) is more work than preconditioning the
numerator to make truncation go in the correct direction.  64-bit ARM
had the same winners and losers as x86_64, at least on the two physical
instances I tested.

============================================================================
folly/test/MathBenchmark.cpp                    relative  time/iter  iters/s
============================================================================
----------------------------------------------------------------------------
divTruncInt8                                                 8.89ns  112.44M
divFloorInt8                                                10.99ns   91.00M
divCeilInt8                                                 10.95ns   91.33M
branchlessDivCeilInt8                            100.40%    10.91ns   91.69M
branchfulDivCeilInt8                              88.87%    12.32ns   81.16M
brokenButWidespreadDivCeilInt8                   109.20%    10.03ns   99.73M
viaFloatDivCeilInt8                              109.68%     9.98ns  100.17M
viaDoubleDivCeilInt8                              95.47%    11.47ns   87.19M
viaLongDoubleDivCeilInt8                          31.65%    34.59ns   28.91M
divRoundAwayInt8                                            10.42ns   95.97M
----------------------------------------------------------------------------
divTruncInt16                                                8.68ns  115.17M
divFloorInt16                                               10.94ns   91.38M
divCeilInt16                                                10.91ns   91.70M
branchlessDivCeilInt16                            99.44%    10.97ns   91.18M
branchfulDivCeilInt16                             81.68%    13.35ns   74.90M
brokenButWidespreadDivCeilInt16                  109.50%     9.96ns  100.40M
viaFloatDivCeilInt16                             108.04%    10.09ns   99.07M
viaDoubleDivCeilInt16                             85.38%    12.77ns   78.29M
viaLongDoubleDivCeilInt16                         29.99%    36.36ns   27.50M
divRoundAwayInt16                                           10.59ns   94.46M
----------------------------------------------------------------------------
divTruncInt32                                                8.38ns  119.29M
divFloorInt32                                               11.01ns   90.84M
divCeilInt32                                                11.12ns   89.91M
branchlessDivCeilInt32                           101.94%    10.91ns   91.66M
branchfulDivCeilInt32                             84.67%    13.14ns   76.12M
brokenButWidespreadDivCeilInt32                  117.61%     9.46ns  105.75M
approxViaFloatDivCeilInt32                       115.98%     9.59ns  104.28M
viaDoubleDivCeilInt32                             89.86%    12.38ns   80.79M
viaLongDoubleDivCeilInt32                         30.84%    36.06ns   27.73M
divRoundAwayInt32                                           11.30ns   88.50M
----------------------------------------------------------------------------
divTruncInt64                                               16.07ns   62.21M
divFloorInt64                                               18.37ns   54.45M
divCeilInt64                                                18.61ns   53.74M
branchlessDivCeilInt64                           100.43%    18.53ns   53.97M
branchfulDivCeilInt64                             84.65%    21.98ns   45.49M
brokenButWidespreadDivCeilInt64                  108.47%    17.16ns   58.29M
approxViaFloatDivCeilInt64                       190.99%     9.74ns  102.64M
approxViaDoubleDivCeilInt64                      148.64%    12.52ns   79.88M
viaLongDoubleDivCeilInt64                         52.01%    35.77ns   27.95M
divRoundAwayInt64                                           18.79ns   53.21M
----------------------------------------------------------------------------
divTruncUint8                                                7.76ns  128.89M
divFloorUint8                                                8.29ns  120.61M
divCeilUint8                                                 9.61ns  104.09M
branchlessDivCeilUint8                           112.00%     8.58ns  116.58M
branchfulDivCeilUint8                            114.01%     8.43ns  118.67M
brokenButWidespreadDivCeilUint8                  100.48%     9.56ns  104.58M
viaFloatDivCeilUint8                             103.53%     9.28ns  107.76M
viaDoubleDivCeilUint8                             85.75%    11.20ns   89.26M
viaLongDoubleDivCeilUint8                         27.72%    34.65ns   28.86M
divRoundAwayUint8                                            9.60ns  104.11M
----------------------------------------------------------------------------
divTruncUint16                                               8.39ns  119.19M
divFloorUint16                                               8.28ns  120.82M
divCeilUint16                                                9.90ns  100.96M
branchlessDivCeilUint16                          100.23%     9.88ns  101.19M
branchfulDivCeilUint16                           107.83%     9.19ns  108.87M
brokenButWidespreadDivCeilUint16                  99.89%     9.92ns  100.85M
viaFloatDivCeilUint16                            100.54%     9.85ns  101.50M
viaDoubleDivCeilUint16                            77.38%    12.80ns   78.13M
viaLongDoubleDivCeilUint16                        27.30%    36.28ns   27.56M
divRoundAwayUint16                                           9.82ns  101.85M
----------------------------------------------------------------------------
divTruncUint32                                               8.12ns  123.20M
divFloorUint32                                               8.09ns  123.58M
divCeilUint32                                                8.44ns  118.55M
branchlessDivCeilUint32                           88.27%     9.56ns  104.64M
branchfulDivCeilUint32                            98.91%     8.53ns  117.25M
brokenButWidespreadDivCeilUint32                  93.48%     9.02ns  110.82M
approxViaFloatDivCeilUint32                       86.29%     9.78ns  102.30M
viaDoubleDivCeilUint32                            66.76%    12.63ns   79.15M
viaLongDoubleDivCeilUint32                        23.35%    36.13ns   27.68M
divRoundAwayUint32                                           8.47ns  118.03M
----------------------------------------------------------------------------
divTruncUint64                                              12.38ns   80.79M
divFloorUint64                                              12.27ns   81.47M
divCeilUint64                                               12.66ns   78.99M
branchlessDivCeilUint64                           93.46%    13.55ns   73.83M
branchfulDivCeilUint64                           100.30%    12.62ns   79.23M
brokenButWidespreadDivCeilUint64                  99.41%    12.73ns   78.53M
approxViaFloatDivCeilUint64                      106.59%    11.88ns   84.19M
approxViaDoubleDivCeilUint64                      92.14%    13.74ns   72.78M
viaLongDoubleDivCeilUint64                        33.51%    37.78ns   26.47M
divRoundAwayUint64                                          12.34ns   81.02M
============================================================================
*/
