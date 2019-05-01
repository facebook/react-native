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

#include <folly/hash/Hash.h>

#include <stdint.h>
#include <deque>
#include <random>
#include <string>
#include <vector>

#include <glog/logging.h>

#include <folly/Benchmark.h>
#include <folly/Format.h>
#include <folly/Preprocessor.h>
#include <folly/portability/GFlags.h>

namespace detail {

std::vector<uint8_t> randomBytes(size_t n) {
  std::vector<uint8_t> ret(n);
  std::default_random_engine rng(1729); // Deterministic seed.
  std::uniform_int_distribution<uint16_t> dist(0, 255);
  std::generate(ret.begin(), ret.end(), [&]() { return dist(rng); });
  return ret;
}

std::vector<uint8_t> benchData = randomBytes(1 << 20); // 1MiB, fits in cache.

template <class Hasher>
void bmHasher(Hasher hasher, size_t k, size_t iters) {
  CHECK_LE(k, benchData.size());
  for (size_t i = 0, pos = 0; i < iters; ++i, ++pos) {
    if (pos == benchData.size() - k + 1) {
      pos = 0;
    }
    folly::doNotOptimizeAway(hasher(benchData.data() + pos, k));
  }
}

template <class Hasher>
void addHashBenchmark(const std::string& name) {
  static std::deque<std::string> names;

  for (size_t i = 0; i < 16; ++i) {
    auto k = size_t(1) << i;
    names.emplace_back(folly::sformat("{}: k=2^{}", name, i));
    folly::addBenchmark(__FILE__, names.back().c_str(), [=](unsigned iters) {
      Hasher hasher;
      bmHasher(hasher, k, iters);
      return iters;
    });
  }

  /* Draw line. */
  folly::addBenchmark(__FILE__, "-", []() { return 0; });
}

struct SpookyHashV2 {
  uint64_t operator()(const uint8_t* data, size_t size) const {
    return folly::hash::SpookyHashV2::Hash64(data, size, 0);
  }
};

struct FNV64 {
  uint64_t operator()(const uint8_t* data, size_t size) const {
    return folly::hash::fnv64_buf(data, size);
  }
};

} // namespace detail

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  google::InitGoogleLogging(argv[0]);

  std::deque<std::string> names; // Backing for benchmark names.

#define BENCHMARK_HASH(HASHER) \
  detail::addHashBenchmark<detail::HASHER>(FB_STRINGIZE(HASHER));

  BENCHMARK_HASH(SpookyHashV2);
  BENCHMARK_HASH(FNV64);

#undef BENCHMARK_HASH

  folly::runBenchmarks();

  return 0;
}

#if 0
Intel(R) Xeon(R) CPU E5-2660 0 @ 2.20GHz
$ hash_benchmark --bm_min_usec=100000
============================================================================
folly/test/HashBenchmark.cpp                    relative  time/iter  iters/s
============================================================================
SpookyHashV2: k=2^0                                         11.67ns   85.66M
SpookyHashV2: k=2^1                                         12.49ns   80.07M
SpookyHashV2: k=2^2                                         11.87ns   84.22M
SpookyHashV2: k=2^3                                         12.36ns   80.89M
SpookyHashV2: k=2^4                                         21.47ns   46.58M
SpookyHashV2: k=2^5                                         22.21ns   45.02M
SpookyHashV2: k=2^6                                         31.47ns   31.78M
SpookyHashV2: k=2^7                                         49.86ns   20.05M
SpookyHashV2: k=2^8                                         69.56ns   14.38M
SpookyHashV2: k=2^9                                        102.99ns    9.71M
SpookyHashV2: k=2^10                                       153.72ns    6.51M
SpookyHashV2: k=2^11                                       271.43ns    3.68M
SpookyHashV2: k=2^12                                       498.85ns    2.00M
SpookyHashV2: k=2^13                                       961.55ns    1.04M
SpookyHashV2: k=2^14                                         1.88us  532.57K
SpookyHashV2: k=2^15                                         3.73us  268.42K
--------------------------------------------------------------------------
FNV64: k=2^0                                                 2.67ns  374.83M
FNV64: k=2^1                                                 4.67ns  214.24M
FNV64: k=2^2                                                10.30ns   97.07M
FNV64: k=2^3                                                23.16ns   43.17M
FNV64: k=2^4                                                48.77ns   20.51M
FNV64: k=2^5                                               100.45ns    9.96M
FNV64: k=2^6                                               201.74ns    4.96M
FNV64: k=2^7                                               399.42ns    2.50M
FNV64: k=2^8                                               801.64ns    1.25M
FNV64: k=2^9                                                 1.59us  627.32K
FNV64: k=2^10                                                3.19us  313.51K
FNV64: k=2^11                                                6.38us  156.80K
FNV64: k=2^12                                               12.75us   78.45K
FNV64: k=2^13                                               25.49us   39.23K
FNV64: k=2^14                                               50.98us   19.62K
FNV64: k=2^15                                              101.93us    9.81K
----------------------------------------------------------------------------
============================================================================
#endif
