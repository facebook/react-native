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
#include <folly/ExceptionWrapper.h>

#include <atomic>
#include <exception>
#include <stdexcept>
#include <thread>
#include <vector>

#include <folly/Benchmark.h>
#include <folly/portability/GFlags.h>

DEFINE_int32(num_threads, 32, "Number of threads to run concurrency "
                              "benchmarks");

/*
 * Use case 1: Library wraps errors in either exception_wrapper or
 * exception_ptr, but user does not care what the exception is after learning
 * that there is one.
 */
BENCHMARK(exception_ptr_create_and_test, iters) {
  std::runtime_error e("payload");
  for (size_t i = 0; i < iters; ++i) {
    auto ep = std::make_exception_ptr(e);
    bool b = static_cast<bool>(ep);
    folly::doNotOptimizeAway(b);
  }
}

BENCHMARK_RELATIVE(exception_wrapper_create_and_test, iters) {
  std::runtime_error e("payload");
  for (size_t i = 0; i < iters; ++i) {
    auto ew = folly::make_exception_wrapper<std::runtime_error>(e);
    bool b = static_cast<bool>(ew);
    folly::doNotOptimizeAway(b);
  }
}

BENCHMARK_DRAW_LINE()

BENCHMARK(exception_ptr_create_and_test_concurrent, iters) {
  std::atomic<bool> go(false);
  std::vector<std::thread> threads;
  BENCHMARK_SUSPEND {
    for (int t = 0; t < FLAGS_num_threads; ++t) {
      threads.emplace_back([&go, iters] {
        while (!go) { }
        std::runtime_error e("payload");
        for (size_t i = 0; i < iters; ++i) {
          auto ep = std::make_exception_ptr(e);
          bool b = static_cast<bool>(ep);
          folly::doNotOptimizeAway(b);
        }
      });
    }
  }
  go.store(true);
  for (auto& t : threads) {
    t.join();
  }
}

BENCHMARK_RELATIVE(exception_wrapper_create_and_test_concurrent, iters) {
  std::atomic<bool> go(false);
  std::vector<std::thread> threads;
  BENCHMARK_SUSPEND {
    for (int t = 0; t < FLAGS_num_threads; ++t) {
      threads.emplace_back([&go, iters] {
        while (!go) { }
        std::runtime_error e("payload");
        for (size_t i = 0; i < iters; ++i) {
          auto ew = folly::make_exception_wrapper<std::runtime_error>(e);
          bool b = static_cast<bool>(ew);
          folly::doNotOptimizeAway(b);
        }
      });
    }
  }
  go.store(true);
  for (auto& t : threads) {
    t.join();
  }
}

BENCHMARK_DRAW_LINE()

/*
 * Use case 2: Library wraps errors in either exception_wrapper or
 * exception_ptr, and user wants to handle std::runtime_error. This can be done
 * either by rehtrowing or with dynamic_cast.
 */
BENCHMARK(exception_ptr_create_and_throw, iters) {
  std::runtime_error e("payload");
  for (size_t i = 0; i < iters; ++i) {
    auto ep = std::make_exception_ptr(e);
    try {
      std::rethrow_exception(ep);
    } catch (std::runtime_error&) {
    }
  }
}

BENCHMARK_RELATIVE(exception_wrapper_create_and_throw, iters) {
  std::runtime_error e("payload");
  for (size_t i = 0; i < iters; ++i) {
    auto ew = folly::make_exception_wrapper<std::runtime_error>(e);
    try {
      ew.throwException();
    } catch (std::runtime_error&) {
    }
  }
}

BENCHMARK_RELATIVE(exception_wrapper_create_and_cast, iters) {
  std::runtime_error e("payload");
  for (size_t i = 0; i < iters; ++i) {
    auto ew = folly::make_exception_wrapper<std::runtime_error>(e);
    bool b = ew.is_compatible_with<std::runtime_error>();
    folly::doNotOptimizeAway(b);
  }
}


BENCHMARK_DRAW_LINE()

BENCHMARK(exception_ptr_create_and_throw_concurrent, iters) {
  std::atomic<bool> go(false);
  std::vector<std::thread> threads;
  BENCHMARK_SUSPEND {
    for (int t = 0; t < FLAGS_num_threads; ++t) {
      threads.emplace_back([&go, iters] {
        while (!go) { }
        std::runtime_error e("payload");
        for (size_t i = 0; i < iters; ++i) {
          auto ep = std::make_exception_ptr(e);
          try {
            std::rethrow_exception(ep);
          } catch (std::runtime_error&) {
          }
        }
      });
    }
  }
  go.store(true);
  for (auto& t : threads) {
    t.join();
  }
}

BENCHMARK_RELATIVE(exception_wrapper_create_and_throw_concurrent, iters) {
  std::atomic<bool> go(false);
  std::vector<std::thread> threads;
  BENCHMARK_SUSPEND {
    for (int t = 0; t < FLAGS_num_threads; ++t) {
      threads.emplace_back([&go, iters] {
        while (!go) { }
        std::runtime_error e("payload");
        for (size_t i = 0; i < iters; ++i) {
          auto ew = folly::make_exception_wrapper<std::runtime_error>(e);
          try {
            ew.throwException();
          } catch (std::runtime_error&) {
          }
        }
      });
    }
  }
  go.store(true);
  for (auto& t : threads) {
    t.join();
  }
}

BENCHMARK_RELATIVE(exception_wrapper_create_and_cast_concurrent, iters) {
  std::atomic<bool> go(false);
  std::vector<std::thread> threads;
  BENCHMARK_SUSPEND {
    for (int t = 0; t < FLAGS_num_threads; ++t) {
      threads.emplace_back([&go, iters] {
        while (!go) { }
        std::runtime_error e("payload");
        for (size_t i = 0; i < iters; ++i) {
          auto ew = folly::make_exception_wrapper<std::runtime_error>(e);
          bool b = ew.is_compatible_with<std::runtime_error>();
          folly::doNotOptimizeAway(b);
        }
      });
    }
  }
  go.store(true);
  for (auto& t : threads) {
    t.join();
  }
}

int main(int argc, char *argv[]) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
  return 0;
}

/*
_bin/folly/test/exception_wrapper_benchmark --bm_min_iters=100000
============================================================================
folly/test/ExceptionWrapperBenchmark.cpp        relative  time/iter  iters/s
============================================================================
exception_ptr_create_and_test                                2.03us  492.88K
exception_wrapper_create_and_test               2542.59%    79.80ns   12.53M
----------------------------------------------------------------------------
exception_ptr_create_and_test_concurrent                   162.39us    6.16K
exception_wrapper_create_and_test_concurrent    95847.91%   169.43ns    5.90M
----------------------------------------------------------------------------
exception_ptr_create_and_throw                               4.24us  236.06K
exception_wrapper_create_and_throw               141.15%     3.00us  333.20K
exception_wrapper_create_and_cast               5321.54%    79.61ns   12.56M
----------------------------------------------------------------------------
exception_ptr_create_and_throw_concurrent                  330.88us    3.02K
exception_wrapper_create_and_throw_concurrent    143.66%   230.32us    4.34K
exception_wrapper_create_and_cast_concurrent    194828.54%   169.83ns    5.89M
============================================================================
*/
