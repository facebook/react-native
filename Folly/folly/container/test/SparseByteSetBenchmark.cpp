/*
 * Copyright 2015-present Facebook, Inc.
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

/***
 *  A benchmark comparing SparseByteSet to bitset<256> and bool[256].
 */

#include <folly/Benchmark.h>
#include <folly/Format.h>
#include <folly/container/SparseByteSet.h>
#include <folly/portability/GFlags.h>
#include <bitset>
#include <random>
#include <vector>

using namespace std;
using namespace folly;

namespace {

//  Interface-identical to SparseByteSet. So that we can do compile-time
//  polymorphism.
class BitSetWrapper {
 public:
  inline bool add(uint8_t i) {
    auto r = !contains(i);
    if (r) {
      rep_[i] = true;
    }
    return r;
  }
  inline bool contains(uint8_t i) {
    return rep_[i];
  }

 private:
  bitset<256> rep_;
};
class BoolArraySet {
 public:
  BoolArraySet() {
    memset(rep_, 0, sizeof(rep_));
  }
  inline bool add(uint8_t i) {
    auto r = !contains(i);
    if (r) {
      rep_[i] = true;
    }
    return r;
  }
  inline bool contains(uint8_t i) {
    return rep_[i];
  }

 private:
  bool rep_[256];
};

template <typename Coll>
void rand_bench(int iters, size_t size_add, size_t size_contains) {
  BenchmarkSuspender braces;
  vector<uint8_t> seq_add;
  vector<uint8_t> seq_contains;
  mt19937 rng;
  uniform_int_distribution<uint8_t> dist;
  for (size_t i = 0; i < size_add; ++i) {
    seq_add.push_back(dist(rng));
  }
  for (size_t i = 0; i < size_contains; ++i) {
    seq_contains.push_back(dist(rng));
  }
  braces.dismissing([&] {
    while (iters--) {
      Coll coll;
      for (auto b : seq_add) {
        coll.add(b);
      }
      bool q{};
      for (auto b : seq_contains) {
        q ^= coll.contains(b);
      }
      doNotOptimizeAway(q);
    }
  });
}

void setup_rand_bench() {
  vector<pair<size_t, size_t>> rand_bench_params = {
      {4, 4},
      {4, 16},
      {4, 64},
      {4, 256},
      {16, 4},
      {16, 16},
      {16, 64},
      {16, 256},
      {64, 4},
      {64, 16},
      {64, 64},
      {64, 256},
      {256, 4},
      {256, 16},
      {256, 64},
      {256, 256},
  };
  for (auto kvp : rand_bench_params) {
    size_t size_add, size_contains;
    tie(size_add, size_contains) = kvp;
    addBenchmark(
        __FILE__,
        sformat("bitset_rand_bench({}, {})", size_add, size_contains).c_str(),
        [=](int iters) {
          rand_bench<BitSetWrapper>(iters, size_add, size_contains);
          return iters;
        });
    addBenchmark(
        __FILE__,
        sformat("%bool_array_set_rand_bench({}, {})", size_add, size_contains)
            .c_str(),
        [=](int iters) {
          rand_bench<BoolArraySet>(iters, size_add, size_contains);
          return iters;
        });
    addBenchmark(
        __FILE__,
        sformat("%sparse_byte_set_rand_bench({}, {})", size_add, size_contains)
            .c_str(),
        [=](int iters) {
          rand_bench<SparseByteSet>(iters, size_add, size_contains);
          return iters;
        });
    addBenchmark(__FILE__, "-", [](int) { return 0; });
  }
}

} // namespace

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  setup_rand_bench();
  runBenchmarks();
  return 0;
}
