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
#include <folly/gen/Base.h>

using namespace folly::gen;
using folly::fbstring;
using std::pair;
using std::set;
using std::tuple;
using std::vector;

static std::atomic<int> testSize(1000);
// clang-format off
static vector<int> testVector =
    seq(1, testSize.load())
  | mapped([](int) { return rand(); })
  | as<vector>();

static vector<vector<int>> testVectorVector =
    seq(1, 100)
  | map([](int i) {
      return seq(1, i) | as<vector>();
    })
  | as<vector>();
static vector<fbstring> strings =
    from(testVector)
  | eachTo<fbstring>()
  | as<vector>();
// clang-format on

auto square = [](int x) { return x * x; };

BENCHMARK(Sum_Basic_NoGen, iters) {
  int limit = testSize.load();
  int s = 0;
  while (iters--) {
    for (int i = 0; i < limit; ++i) {
      s += i;
    }
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_RELATIVE(Sum_Basic_Gen, iters) {
  int limit = testSize.load();
  int s = 0;
  while (iters--) {
    s += range(0, limit) | sum;
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_DRAW_LINE();

BENCHMARK(Sum_Vector_NoGen, iters) {
  int s = 0;
  while (iters--) {
    for (auto& i : testVector) {
      s += i;
    }
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_RELATIVE(Sum_Vector_Gen, iters) {
  int s = 0;
  while (iters--) {
    s += from(testVector) | sum;
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_DRAW_LINE();

BENCHMARK(Member, iters) {
  int s = 0;
  while (iters--) {
    // clang-format off
    s += from(strings)
       | member(&fbstring::size)
       | sum;
    // clang-format on
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_RELATIVE(MapMember, iters) {
  int s = 0;
  while (iters--) {
    // clang-format off
    s += from(strings)
       | map([](const fbstring& x) { return x.size(); })
       | sum;
    // clang-format on
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_DRAW_LINE();

BENCHMARK(Count_Vector_NoGen, iters) {
  int s = 0;
  while (iters--) {
    for (auto& i : testVector) {
      if (i * 2 < rand()) {
        ++s;
      }
    }
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_RELATIVE(Count_Vector_Gen, iters) {
  int s = 0;
  while (iters--) {
    // clang-format off
    s += from(testVector)
       | filter([](int i) {
                  return i * 2 < rand();
                })
       | count;
    // clang-format on
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_DRAW_LINE();

BENCHMARK(Fib_Sum_NoGen, iters) {
  int s = 0;
  while (iters--) {
    auto fib = [](size_t limit) -> vector<int> {
      vector<int> ret;
      int a = 0;
      int b = 1;
      for (size_t i = 0; i < limit; i += 2) {
        ret.push_back(a += b);
        ret.push_back(b += a);
      }
      return ret;
    };
    for (auto& v : fib(testSize.load())) {
      s += v;
    }
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_RELATIVE(Fib_Sum_Gen, iters) {
  int s = 0;
  while (iters--) {
    auto fib = GENERATOR(int) {
      int a = 0;
      int b = 1;
      for (;;) {
        yield(a += b);
        yield(b += a);
      }
    };
    // Early stopping implemented with exceptions.
    s += fib | take(testSize.load()) | sum;
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_RELATIVE(Fib_Sum_Gen_Limit, iters) {
  int s = 0;
  while (iters--) {
    size_t limit = testSize.load();
    auto fib = GENERATOR(int) {
      int a = 0;
      int b = 1;
      for (size_t i = 0; i < limit; i += 2) {
        yield(a += b);
        yield(b += a);
      }
    };
    // No early stopping.
    s += fib | sum;
  }
  folly::doNotOptimizeAway(s);
}

struct FibYielder {
  template <class Yield>
  void operator()(Yield&& yield) const {
    int a = 0;
    int b = 1;
    for (;;) {
      yield(a += b);
      yield(b += a);
    }
  }
};

BENCHMARK_RELATIVE(Fib_Sum_Gen_Static, iters) {
  int s = 0;
  while (iters--) {
    auto fib = generator<int>(FibYielder());
    s += fib | take(testSize.load()) | sum;
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_DRAW_LINE();

BENCHMARK(VirtualGen_0Virtual, iters) {
  int s = 0;
  while (iters--) {
    auto numbers = seq(1, 10000);
    auto squares = numbers | map(square);
    auto quads = squares | map(square);
    s += quads | sum;
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_RELATIVE(VirtualGen_1Virtual, iters) {
  int s = 0;
  while (iters--) {
    VirtualGen<int> numbers = seq(1, 10000);
    auto squares = numbers | map(square);
    auto quads = squares | map(square);
    s += quads | sum;
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_RELATIVE(VirtualGen_2Virtual, iters) {
  int s = 0;
  while (iters--) {
    VirtualGen<int> numbers = seq(1, 10000);
    VirtualGen<int> squares = numbers | map(square);
    auto quads = squares | map(square);
    s += quads | sum;
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_RELATIVE(VirtualGen_3Virtual, iters) {
  int s = 0;
  while (iters--) {
    VirtualGen<int> numbers = seq(1, 10000);
    VirtualGen<int> squares = numbers | map(square);
    VirtualGen<int> quads = squares | map(square);
    s += quads | sum;
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_DRAW_LINE();

BENCHMARK(Concat_NoGen, iters) {
  int s = 0;
  while (iters--) {
    for (auto& v : testVectorVector) {
      for (auto& i : v) {
        s += i;
      }
    }
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_RELATIVE(Concat_Gen, iters) {
  int s = 0;
  while (iters--) {
    s += from(testVectorVector) | rconcat | sum;
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_DRAW_LINE();

BENCHMARK(Composed_NoGen, iters) {
  int s = 0;
  while (iters--) {
    for (auto& i : testVector) {
      s += i * i;
    }
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_RELATIVE(Composed_Gen, iters) {
  int s = 0;
  auto sumSq = map(square) | sum;
  while (iters--) {
    s += from(testVector) | sumSq;
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_RELATIVE(Composed_GenRegular, iters) {
  int s = 0;
  while (iters--) {
    s += from(testVector) | map(square) | sum;
  }
  folly::doNotOptimizeAway(s);
}

BENCHMARK_DRAW_LINE();

BENCHMARK(Sample, iters) {
  size_t s = 0;
  while (iters--) {
    auto sampler = seq(1, 10 * 1000 * 1000) | sample(1000);
    s += (sampler | sum);
  }
  folly::doNotOptimizeAway(s);
}

// Results from an Intel(R) Xeon(R) CPU E5-2660 0 @ 2.20GHz
// ============================================================================
// folly/gen/test/BaseBenchmark.cpp                relative  time/iter  iters/s
// ============================================================================
// Sum_Basic_NoGen                                            372.39ns    2.69M
// Sum_Basic_Gen                                    195.96%   190.03ns    5.26M
// ----------------------------------------------------------------------------
// Sum_Vector_NoGen                                           200.41ns    4.99M
// Sum_Vector_Gen                                    77.14%   259.81ns    3.85M
// ----------------------------------------------------------------------------
// Member                                                       4.56us  219.42K
// MapMember                                        400.47%     1.14us  878.73K
// ----------------------------------------------------------------------------
// Count_Vector_NoGen                                          13.96us   71.64K
// Count_Vector_Gen                                  86.05%    16.22us   61.65K
// ----------------------------------------------------------------------------
// Fib_Sum_NoGen                                                2.21us  452.63K
// Fib_Sum_Gen                                       23.94%     9.23us  108.36K
// Fib_Sum_Gen_Static                                48.77%     4.53us  220.73K
// ----------------------------------------------------------------------------
// VirtualGen_0Virtual                                          9.60us  104.13K
// VirtualGen_1Virtual                               28.00%    34.30us   29.15K
// VirtualGen_2Virtual                               22.62%    42.46us   23.55K
// VirtualGen_3Virtual                               16.96%    56.64us   17.66K
// ----------------------------------------------------------------------------
// Concat_NoGen                                                 2.20us  453.66K
// Concat_Gen                                       109.49%     2.01us  496.70K
// ----------------------------------------------------------------------------
// Composed_NoGen                                             545.32ns    1.83M
// Composed_Gen                                      87.94%   620.07ns    1.61M
// Composed_GenRegular                               88.13%   618.74ns    1.62M
// ----------------------------------------------------------------------------
// Sample                                                     176.48ms     5.67
// ============================================================================

int main(int argc, char* argv[]) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
  return 0;
}
