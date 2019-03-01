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

#include <folly/Benchmark.h>
#include <folly/Foreach.h>
#include <folly/String.h>
#include <algorithm>
#include <iostream>
#include <numeric>
#include <random>
#include <vector>
using namespace folly;
using namespace std;

void fun() {
  static double x = 1;
  ++x;
  doNotOptimizeAway(x);
}
BENCHMARK(bmFun) { fun(); }
BENCHMARK(bmRepeatedFun, n) {
  FOR_EACH_RANGE (i, 0, n) {
    fun();
  }
}
BENCHMARK_DRAW_LINE()

BENCHMARK(gun) {
  static double x = 1;
  x *= 2000;
  doNotOptimizeAway(x);
}

BENCHMARK_DRAW_LINE()

BENCHMARK(optimizerCanDiscardTrivial, n) {
  long x = 0;
  for (long i = 0; i < n; ++i) {
    for (long j = 0; j < 10000; ++j) {
      x += j;
    }
  }
}

BENCHMARK(optimizerCanPowerReduceInner1Trivial, n) {
  long x = 0;
  for (long i = 0; i < n; ++i) {
    for (long j = 0; j < 10000; ++j) {
      x += i + j;
    }
    doNotOptimizeAway(x);
  }
}

BENCHMARK(optimizerCanPowerReduceInner2Trivial, n) {
  long x = 0;
  for (long i = 0; i < n; ++i) {
    makeUnpredictable(i);
    for (long j = 0; j < 10000; ++j) {
      x += i + j;
    }
  }
  doNotOptimizeAway(x);
}

BENCHMARK(optimizerDisabled1Trivial, n) {
  long x = 0;
  for (long i = 0; i < n; ++i) {
    for (long j = 0; j < 10000; ++j) {
      x += i + j;
      doNotOptimizeAway(x);
    }
  }
}

BENCHMARK(optimizerDisabled2Trivial, n) {
  long x = 0;
  for (long i = 0; i < n; ++i) {
    makeUnpredictable(i);
    for (long j = 0; j < 10000; ++j) {
      makeUnpredictable(j);
      x += i + j;
    }
  }
  doNotOptimizeAway(x);
}

BENCHMARK(optimizerCanPowerReduceInner1TrivialPtr, n) {
  long x = 0;
  for (long i = 0; i < n; ++i) {
    for (long j = 0; j < 10000; ++j) {
      x += i + j;
    }
    doNotOptimizeAway(&x);
  }
}

BENCHMARK(optimizerCanPowerReduceInner2TrivialPtr, n) {
  long x = 0;
  for (long i = 0; i < n; ++i) {
    makeUnpredictable(i);
    for (long j = 0; j < 10000; ++j) {
      x += i + j;
    }
  }
  doNotOptimizeAway(&x);
}

BENCHMARK(optimizerDisabled1TrivialPtr, n) {
  long x = 0;
  for (long i = 0; i < n; ++i) {
    for (long j = 0; j < 10000; ++j) {
      x += i + j;
      doNotOptimizeAway(&x);
    }
  }
}

namespace {
class NonTrivialLong {
 public:
  explicit NonTrivialLong(long v) : value_(v) {}
  virtual ~NonTrivialLong() {}

  void operator++() {
    ++value_;
  }
  void operator+=(long rhs) {
    value_ += rhs;
  }
  void operator+=(const NonTrivialLong& rhs) {
    value_ += rhs.value_;
  }
  bool operator<(long rhs) {
    return value_ < rhs;
  }
  NonTrivialLong operator+(const NonTrivialLong& rhs) {
    return NonTrivialLong(value_ + rhs.value_);
  }

 private:
  long value_;
  long otherStuff_[3];
};
}

BENCHMARK(optimizerCanDiscardNonTrivial, n) {
  NonTrivialLong x(0);
  for (NonTrivialLong i(0); i < n; ++i) {
    for (NonTrivialLong j(0); j < 10000; ++j) {
      x += j;
    }
  }
}

BENCHMARK(optimizerCanPowerReduceInner1NonTrivial, n) {
  NonTrivialLong x(0);
  for (NonTrivialLong i(0); i < n; ++i) {
    for (NonTrivialLong j(0); j < 10000; ++j) {
      x += i + j;
    }
    doNotOptimizeAway(x);
  }
}

BENCHMARK(optimizerCanPowerReduceInner2NonTrivial, n) {
  NonTrivialLong x(0);
  for (NonTrivialLong i(0); i < n; ++i) {
    makeUnpredictable(i);
    for (NonTrivialLong j(0); j < 10000; ++j) {
      x += i + j;
    }
  }
  doNotOptimizeAway(x);
}

BENCHMARK(optimizerDisabled1NonTrivial, n) {
  NonTrivialLong x(0);
  for (NonTrivialLong i(0); i < n; ++i) {
    for (NonTrivialLong j(0); j < 10000; ++j) {
      x += i + j;
      doNotOptimizeAway(x);
    }
  }
}

BENCHMARK(optimizerDisabled2NonTrivial, n) {
  NonTrivialLong x(0);
  for (NonTrivialLong i(0); i < n; ++i) {
    makeUnpredictable(i);
    for (NonTrivialLong j(0); j < 10000; ++j) {
      makeUnpredictable(j);
      x += i + j;
    }
  }
  doNotOptimizeAway(x);
}

BENCHMARK(optimizerCanPowerReduceInner1NonTrivialPtr, n) {
  NonTrivialLong x(0);
  for (NonTrivialLong i(0); i < n; ++i) {
    for (NonTrivialLong j(0); j < 10000; ++j) {
      x += i + j;
    }
    doNotOptimizeAway(&x);
  }
}

BENCHMARK(optimizerCanPowerReduceInner2NonTrivialPtr, n) {
  NonTrivialLong x(0);
  for (NonTrivialLong i(0); i < n; ++i) {
    makeUnpredictable(i);
    for (NonTrivialLong j(0); j < 10000; ++j) {
      x += i + j;
    }
  }
  doNotOptimizeAway(&x);
}

BENCHMARK(optimizerDisabled1NonTrivialPtr, n) {
  NonTrivialLong x(0);
  for (NonTrivialLong i(0); i < n; ++i) {
    for (NonTrivialLong j(0); j < 10000; ++j) {
      x += i + j;
      doNotOptimizeAway(&x);
    }
  }
}

BENCHMARK_DRAW_LINE()

BENCHMARK(baselinevector) {
  vector<int> v;

  BENCHMARK_SUSPEND {
    v.resize(1000);
  }

  FOR_EACH_RANGE (i, 0, 100) {
    v.push_back(42);
  }
}

BENCHMARK_RELATIVE(bmVector) {
  vector<int> v;
  FOR_EACH_RANGE (i, 0, 100) {
    v.resize(v.size() + 1, 42);
  }
}

BENCHMARK_DRAW_LINE()

BENCHMARK(superslow) {
  sleep(1);
}

BENCHMARK_DRAW_LINE()

BENCHMARK(noMulti) {
  fun();
}

BENCHMARK_MULTI(multiSimple) {
  FOR_EACH_RANGE (i, 0, 10) {
    fun();
  }
  return 10;
}

BENCHMARK_RELATIVE_MULTI(multiSimpleRel) {
  FOR_EACH_RANGE (i, 0, 10) {
    fun();
    fun();
  }
  return 10;
}

BENCHMARK_MULTI(multiIterArgs, iter) {
  FOR_EACH_RANGE (i, 0, 10 * iter) {
    fun();
  }
  return 10 * iter;
}

BENCHMARK_RELATIVE_MULTI(multiIterArgsRel, iter) {
  FOR_EACH_RANGE (i, 0, 10 * iter) {
    fun();
    fun();
  }
  return 10 * iter;
}

unsigned paramMulti(unsigned iter, unsigned num) {
  for (unsigned i = 0; i < iter; ++i) {
    for (unsigned j = 0; j < num; ++j) {
      fun();
    }
  }
  return num * iter;
}

unsigned paramMultiRel(unsigned iter, unsigned num) {
  for (unsigned i = 0; i < iter; ++i) {
    for (unsigned j = 0; j < num; ++j) {
      fun();
      fun();
    }
  }
  return num * iter;
}

BENCHMARK_PARAM_MULTI(paramMulti, 1);
BENCHMARK_RELATIVE_PARAM_MULTI(paramMultiRel, 1);

BENCHMARK_PARAM_MULTI(paramMulti, 5);
BENCHMARK_RELATIVE_PARAM_MULTI(paramMultiRel, 5);

BENCHMARK_DRAW_LINE();

BENCHMARK(BenchmarkSuspender_dismissing_void, iter) {
  BenchmarkSuspender braces;
  mt19937_64 rng;
  while (iter--) {
    vector<size_t> v(1 << 12, 0);
    iota(v.begin(), v.end(), 0);
    shuffle(v.begin(), v.end(), rng);
    braces.dismissing([&] {
        sort(v.begin(), v.end());
    });
  }
}

BENCHMARK(BenchmarkSuspender_dismissing_value, iter) {
  BenchmarkSuspender braces;
  mt19937_64 rng;
  while (iter--) {
    vector<size_t> v(1 << 12, 0);
    iota(v.begin(), v.end(), 0);
    shuffle(v.begin(), v.end(), rng);
    auto s = braces.dismissing([&] {
        sort(v.begin(), v.end());
        return accumulate(v.begin(), v.end(), 0, [](size_t a, size_t e) {
            return a + e;
        });
    });
    doNotOptimizeAway(s);
  }
}

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  runBenchmarks();
  runBenchmarksOnFlag();
}
