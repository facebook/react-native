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
#include <folly/Synchronized.h>

#include <folly/Benchmark.h>
#include <folly/portability/GTest.h>

#include <algorithm>
#include <condition_variable>
#include <map>
#include <memory>
#include <mutex>
#include <shared_mutex>
#include <thread>

using namespace folly;
using namespace folly::detail;

DEFINE_uint64(iterations, 100, "The number of iterations with lock held");

/**
 * Benchmarks:
 *
 * lock(folly::wlock(one), folly::rlock(two));
 * ------------
 * Three deadlock avoidance algorithms have been tested here with threads
 * locking a subset of the set of mutexes.  Two of the relevant algorithms and
 * their descriptions can be found here -
 * http://howardhinnant.github.io/dining_philosophers.html.  The ones tested
 * from that link are the ones named "Smart" and "Persistent".  The third one
 * tested is the standard ordered algorithm which locks mutexes in order of
 * their addresses.
 *
 * The benchmarks show that the "smart" algorithm almost always has better
 * performance under contention when acquiring more than one mutex.  Even in
 * simple cases.  In uncontended cases, all the algorithms perform the same
 *
 * ============================================================================
 * folly/test/SynchronizedBenchmark.cpp            relative  time/iter  iters/s
 * ============================================================================
 * UncontendedFollyLock                                        66.53ns   15.03M
 * UncontendedStdLock                                          68.72ns   14.55M
 * UncontendedOrdered                                          64.41ns   15.53M
 * UncontendedReverseOrdered                                   64.40ns   15.53M
 * ----------------------------------------------------------------------------
 * ThreeThreadsSimpleFollyLock                                  4.14us  241.57K
 * ThreeThreadsSimpleStdLock                                    5.17us  193.47K
 * ThreeThreadsSimpleOrdered                                    6.34us  157.81K
 * ThreeThreadsSimpleCarefullyOrdered                           6.27us  159.47K
 * ----------------------------------------------------------------------------
 * ThreeThreadsPathologicalFollyLock                            3.81us  262.24K
 * ThreeThreadsPathologicalStdLock                              5.34us  187.28K
 * ThreeThreadsPathologicalOrdered                              6.36us  157.28K
 * ThreeThreadsPathologicalCarefullyOrdered                     4.21us  237.29K
 * ----------------------------------------------------------------------------
 * TwoThreadsTwoMutexesOrdered                                260.87ns    3.83M
 * TwoThreadsTwoMutexesSmart                                  161.28ns    6.20M
 * TwoThreadsTwoMutexesPersistent                             226.25ns    4.42M
 * ----------------------------------------------------------------------------
 * TwoThreadsFourMutexesOrdered                               196.01ns    5.10M
 * TwoThreadsFourMutexesSmart                                 196.73ns    5.08M
 * TwoThreadsFourMutexesPersistent                            201.70ns    4.96M
 * ----------------------------------------------------------------------------
 * TwoThreadsEightMutexesOrdered                              195.76ns    5.11M
 * TwoThreadsEightMutexesSmart                                187.90ns    5.32M
 * TwoThreadsEightMutexesPersistent                           199.21ns    5.02M
 * ----------------------------------------------------------------------------
 * TwoThreadsSixteenMutexesOrdered                            203.91ns    4.90M
 * TwoThreadsSixteenMutexesSmart                              196.30ns    5.09M
 * TwoThreadsSixteenMutexesPersistent                         230.64ns    4.34M
 * ----------------------------------------------------------------------------
 * FourThreadsTwoMutexesOrdered                               814.98ns    1.23M
 * FourThreadsTwoMutexesSmart                                 559.79ns    1.79M
 * FourThreadsTwoMutexesPersistent                            520.90ns    1.92M
 * ----------------------------------------------------------------------------
 * FourThreadsFourMutexesOrdered                              456.04ns    2.19M
 * FourThreadsFourMutexesSmart                                391.69ns    2.55M
 * FourThreadsFourMutexesPersistent                           414.56ns    2.41M
 * ----------------------------------------------------------------------------
 * FourThreadsEightMutexesOrdered                             392.20ns    2.55M
 * FourThreadsEightMutexesSmart                               277.89ns    3.60M
 * FourThreadsEightMutexesPersistent                          301.98ns    3.31M
 * ----------------------------------------------------------------------------
 * FourThreadsSixteenMutexesOrdered                           356.36ns    2.81M
 * FourThreadsSixteenMutexesSmart                             291.40ns    3.43M
 * FourThreadsSixteenMutexesPersistent                        292.23ns    3.42M
 * ----------------------------------------------------------------------------
 * EightThreadsTwoMutexesOrdered                                1.58us  634.85K
 * EightThreadsTwoMutexesSmart                                  1.58us  634.85K
 * EightThreadsTwoMutexesPersistent                             1.56us  639.93K
 * ----------------------------------------------------------------------------
 * EightThreadsFourMutexesOrdered                               1.33us  753.45K
 * EightThreadsFourMutexesSmart                               794.36ns  936.34K
 * EightThreadsFourMutexesPersistent                          831.68ns    1.21M
 * ----------------------------------------------------------------------------
 * EightThreadsEightMutexesOrdered                            791.52ns    1.26M
 * EightThreadsEightMutexesSmart                              548.05ns    1.51M
 * EightThreadsEightMutexesPersistent                         563.14ns    2.78M
 * ----------------------------------------------------------------------------
 * EightThreadsSixteenMutexesOrdered                          785.40ns    2.11M
 * EightThreadsSixteenMutexesSmart                            541.27ns    1.60M
 * EightThreadsSixteenMutexesPersistent                       673.49ns    1.79M
 * ----------------------------------------------------------------------------
 * SixteenThreadsTwoMutexesOrdered                              1.98us  505.83K
 * SixteenThreadsTwoMutexesSmart                                1.85us  541.06K
 * SixteenThreadsTwoMutexesPersistent                           3.13us  319.53K
 * ----------------------------------------------------------------------------
 * SixteenThreadsFourMutexesOrdered                             2.46us  407.07K
 * SixteenThreadsFourMutexesSmart                               1.68us  594.47K
 * SixteenThreadsFourMutexesPersistent                          1.62us  617.22K
 * ----------------------------------------------------------------------------
 * SixteenThreadsEightMutexesOrdered                            1.67us  597.45K
 * SixteenThreadsEightMutexesSmart                              1.62us  616.83K
 * SixteenThreadsEightMutexesPersistent                         1.57us  637.50K
 * ----------------------------------------------------------------------------
 * SixteenThreadsSixteenMutexesOrdered                          1.20us  829.93K
 * SixteenThreadsSixteenMutexesSmart                            1.32us  757.03K
 * SixteenThreadsSixteenMutexesPersistent                       1.38us  726.75K
 * ============================================================================
 */

namespace {
template <typename NonMovableType>
std::vector<std::unique_ptr<NonMovableType>> makeVector(int num);

/**
 * Spin n times
 */
void spin(int n);

/**
 * Generic tests for three deadlock avoidance algorithms
 */
template <typename Mutex>
void ordered(
    std::size_t iters,
    int threads,
    std::vector<std::unique_ptr<Mutex>> mutexes);
template <typename Mutex>
void smart(
    std::size_t iters,
    int threads,
    std::vector<std::unique_ptr<Mutex>> mutexes);
template <typename Mutex>
void persistent(
    std::size_t iters,
    int threads,
    std::vector<std::unique_ptr<Mutex>> mutexes);

/**
 * Pathological case where the current folly::lock algorithm performs up to 2x
 * better than simple ordered locking
 *
 * This test degrades to pathological performance if the order of mutex
 * locking is not picked with care.  The thread that locks mutexes in a
 * deadlock avoiding manner is not doing much work.  And acquiring the locks
 * in order blocks another thread completely because it waits for a third
 * thread to finish processing before it can do its thing and let the second
 * thread proceed, effectively limiting the concurrency of the three threads
 *
 * The non-obvious resolution for the performance pathology is to change the
 * order of lock acquisition
 */
template <typename LockingFunc>
void pathological(std::size_t iters, LockingFunc func);

/**
 * Simple mutex acquisition, in this test one thread acquires two mutexes does
 * very little work and releases the mutexes, while two other threads are
 * trying to acquire the mutexes independently and doing work
 */
template <typename LockingFunc>
void simple(std::size_t iters, LockingFunc func);

/**
 * Simple uncontended mutex acquisition
 */
template <typename LockingFunc>
void uncontended(std::size_t iters, LockingFunc func);

/**
 * Help start tests only when the given number of threads have hit the start
 * line
 */
class BenchmarkStartBarrier {
 public:
  explicit BenchmarkStartBarrier(int threads) : threads_{threads + 1} {}

  void wait() {
    auto lck = std::unique_lock<std::mutex>{mutex_};
    ++started_;

    // if all the threads have started the benchmarks
    if (started_ == threads_) {
      cv_.notify_all();
      return;
    }

    // wait till all the threads have started
    while (started_ != threads_) {
      cv_.wait(lck);
    }
  }

  std::mutex mutex_;
  std::condition_variable cv_;
  const int threads_;
  int started_{0};
};
} // namespace

BENCHMARK(UncontendedFollyLock, iters) {
  uncontended(iters, [](auto& one, auto& two) { folly::lock(one, two); });
}

BENCHMARK(UncontendedStdLock, iters) {
  uncontended(iters, [](auto& one, auto& two) { std::lock(one, two); });
}

BENCHMARK(UncontendedOrdered, iters) {
  uncontended(iters, [](auto& one, auto& two) {
    one.lock();
    two.lock();
  });
}

BENCHMARK(UncontendedReverseOrdered, iters) {
  uncontended(iters, [](auto& one, auto& two) {
    two.lock();
    one.lock();
  });
}

BENCHMARK_DRAW_LINE();

BENCHMARK(ThreeThreadsSimpleFollyLock, iters) {
  simple(iters, [](auto& one, auto& two) { folly::lock(one, two); });
}

BENCHMARK(ThreeThreadsSimpleStdLock, iters) {
  simple(iters, [](auto& one, auto& two) { std::lock(one, two); });
}

BENCHMARK(ThreeThreadsSimpleOrdered, iters) {
  simple(iters, [](auto& one, auto& two) {
    one.lock();
    two.lock();
  });
}

BENCHMARK(ThreeThreadsSimpleReverseOrdered, iters) {
  simple(iters, [](auto& one, auto& two) {
    two.lock();
    one.lock();
  });
}

BENCHMARK_DRAW_LINE();

BENCHMARK(ThreeThreadsPathologicalFollyLock, iters) {
  pathological(iters, [](auto& one, auto& two, auto& three) {
    folly::lock(one, two, three);
  });
}

BENCHMARK(ThreeThreadsPathologicalStdLock, iters) {
  pathological(iters, [](auto& one, auto& two, auto& three) {
    std::lock(one, two, three);
  });
}

BENCHMARK(ThreeThreadsPathologicalOrdered, iters) {
  pathological(iters, [](auto& one, auto& two, auto& three) {
    one.lock();
    two.lock();
    three.lock();
  });
}

BENCHMARK(ThreeThreadsPathologicalCarefullyOrdered, iters) {
  pathological(iters, [](auto& one, auto& two, auto& three) {
    two.lock();
    three.lock();
    one.lock();
  });
}

BENCHMARK_DRAW_LINE();

BENCHMARK(TwoThreadsTwoMutexesOrdered, iters) {
  ordered(iters, 2, makeVector<std::mutex>(2));
}
BENCHMARK(TwoThreadsTwoMutexesSmart, iters) {
  smart(iters, 2, makeVector<std::mutex>(2));
}
BENCHMARK(TwoThreadsTwoMutexesPersistent, iters) {
  persistent(iters, 2, makeVector<std::mutex>(2));
}

BENCHMARK_DRAW_LINE();

BENCHMARK(TwoThreadsFourMutexesOrdered, iters) {
  ordered(iters, 2, makeVector<std::mutex>(4));
}
BENCHMARK(TwoThreadsFourMutexesSmart, iters) {
  smart(iters, 2, makeVector<std::mutex>(4));
}
BENCHMARK(TwoThreadsFourMutexesPersistent, iters) {
  persistent(iters, 2, makeVector<std::mutex>(4));
}

BENCHMARK_DRAW_LINE();

BENCHMARK(TwoThreadsEightMutexesOrdered, iters) {
  ordered(iters, 2, makeVector<std::mutex>(8));
}
BENCHMARK(TwoThreadsEightMutexesSmart, iters) {
  smart(iters, 2, makeVector<std::mutex>(8));
}
BENCHMARK(TwoThreadsEightMutexesPersistent, iters) {
  persistent(iters, 2, makeVector<std::mutex>(8));
}

BENCHMARK_DRAW_LINE();

BENCHMARK(TwoThreadsSixteenMutexesOrdered, iters) {
  ordered(iters, 2, makeVector<std::mutex>(16));
}
BENCHMARK(TwoThreadsSixteenMutexesSmart, iters) {
  smart(iters, 2, makeVector<std::mutex>(16));
}
BENCHMARK(TwoThreadsSixteenMutexesPersistent, iters) {
  persistent(iters, 2, makeVector<std::mutex>(16));
}

BENCHMARK_DRAW_LINE();

BENCHMARK(FourThreadsTwoMutexesOrdered, iters) {
  ordered(iters, 4, makeVector<std::mutex>(2));
}
BENCHMARK(FourThreadsTwoMutexesSmart, iters) {
  smart(iters, 4, makeVector<std::mutex>(2));
}
BENCHMARK(FourThreadsTwoMutexesPersistent, iters) {
  persistent(iters, 4, makeVector<std::mutex>(2));
}

BENCHMARK_DRAW_LINE();

BENCHMARK(FourThreadsFourMutexesOrdered, iters) {
  ordered(iters, 4, makeVector<std::mutex>(4));
}
BENCHMARK(FourThreadsFourMutexesSmart, iters) {
  smart(iters, 4, makeVector<std::mutex>(4));
}
BENCHMARK(FourThreadsFourMutexesPersistent, iters) {
  persistent(iters, 4, makeVector<std::mutex>(4));
}

BENCHMARK_DRAW_LINE();

BENCHMARK(FourThreadsEightMutexesOrdered, iters) {
  ordered(iters, 4, makeVector<std::mutex>(8));
}
BENCHMARK(FourThreadsEightMutexesSmart, iters) {
  smart(iters, 4, makeVector<std::mutex>(8));
}
BENCHMARK(FourThreadsEightMutexesPersistent, iters) {
  persistent(iters, 4, makeVector<std::mutex>(8));
}

BENCHMARK_DRAW_LINE();

BENCHMARK(FourThreadsSixteenMutexesOrdered, iters) {
  ordered(iters, 4, makeVector<std::mutex>(16));
}
BENCHMARK(FourThreadsSixteenMutexesSmart, iters) {
  smart(iters, 4, makeVector<std::mutex>(16));
}
BENCHMARK(FourThreadsSixteenMutexesPersistent, iters) {
  persistent(iters, 4, makeVector<std::mutex>(16));
}

BENCHMARK_DRAW_LINE();

BENCHMARK(EightThreadsTwoMutexesOrdered, iters) {
  ordered(iters, 8, makeVector<std::mutex>(2));
}
BENCHMARK(EightThreadsTwoMutexesSmart, iters) {
  smart(iters, 8, makeVector<std::mutex>(2));
}
BENCHMARK(EightThreadsTwoMutexesPersistent, iters) {
  persistent(iters, 8, makeVector<std::mutex>(2));
}

BENCHMARK_DRAW_LINE();

BENCHMARK(EightThreadsFourMutexesOrdered, iters) {
  ordered(iters, 8, makeVector<std::mutex>(4));
}
BENCHMARK(EightThreadsFourMutexesSmart, iters) {
  smart(iters, 8, makeVector<std::mutex>(4));
}
BENCHMARK(EightThreadsFourMutexesPersistent, iters) {
  persistent(iters, 8, makeVector<std::mutex>(4));
}

BENCHMARK_DRAW_LINE();

BENCHMARK(EightThreadsEightMutexesOrdered, iters) {
  ordered(iters, 8, makeVector<std::mutex>(8));
}
BENCHMARK(EightThreadsEightMutexesSmart, iters) {
  smart(iters, 8, makeVector<std::mutex>(8));
}
BENCHMARK(EightThreadsEightMutexesPersistent, iters) {
  persistent(iters, 8, makeVector<std::mutex>(8));
}

BENCHMARK_DRAW_LINE();

BENCHMARK(EightThreadsSixteenMutexesOrdered, iters) {
  ordered(iters, 8, makeVector<std::mutex>(16));
}
BENCHMARK(EightThreadsSixteenMutexesSmart, iters) {
  smart(iters, 8, makeVector<std::mutex>(16));
}
BENCHMARK(EightThreadsSixteenMutexesPersistent, iters) {
  persistent(iters, 8, makeVector<std::mutex>(16));
}

BENCHMARK_DRAW_LINE();

BENCHMARK(SixteenThreadsTwoMutexesOrdered, iters) {
  ordered(iters, 16, makeVector<std::mutex>(2));
}
BENCHMARK(SixteenThreadsTwoMutexesSmart, iters) {
  smart(iters, 16, makeVector<std::mutex>(2));
}
BENCHMARK(SixteenThreadsTwoMutexesPersistent, iters) {
  persistent(iters, 16, makeVector<std::mutex>(2));
}

BENCHMARK_DRAW_LINE();

BENCHMARK(SixteenThreadsFourMutexesOrdered, iters) {
  ordered(iters, 16, makeVector<std::mutex>(4));
}
BENCHMARK(SixteenThreadsFourMutexesSmart, iters) {
  smart(iters, 16, makeVector<std::mutex>(4));
}
BENCHMARK(SixteenThreadsFourMutexesPersistent, iters) {
  persistent(iters, 16, makeVector<std::mutex>(4));
}

BENCHMARK_DRAW_LINE();

BENCHMARK(SixteenThreadsEightMutexesOrdered, iters) {
  ordered(iters, 16, makeVector<std::mutex>(8));
}
BENCHMARK(SixteenThreadsEightMutexesSmart, iters) {
  smart(iters, 16, makeVector<std::mutex>(8));
}
BENCHMARK(SixteenThreadsEightMutexesPersistent, iters) {
  persistent(iters, 16, makeVector<std::mutex>(8));
}

BENCHMARK_DRAW_LINE();

BENCHMARK(SixteenThreadsSixteenMutexesOrdered, iters) {
  ordered(iters, 16, makeVector<std::mutex>(16));
}
BENCHMARK(SixteenThreadsSixteenMutexesSmart, iters) {
  smart(iters, 16, makeVector<std::mutex>(16));
}
BENCHMARK(SixteenThreadsSixteenMutexesPersistent, iters) {
  persistent(iters, 16, makeVector<std::mutex>(16));
}

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();
}

namespace {
std::pair<int, int> getMutexIndices(int threadId, int mutexListSize) {
  // assign two mutexes to the current thread, we need to prevent
  // deadlocks here by resorting the indexes in increasing order,
  // because a thread might pick the last mutex as the one it locks and
  // then adding one to that will make it wrap around, breaking the
  // ordering
  auto index = threadId % mutexListSize;

  auto firstMutexIndex = ((index + 1) == mutexListSize) ? 0 : index;
  auto secondMutexIndex =
      ((index + 1) == mutexListSize) ? (mutexListSize - 1) : (index + 1);

  return std::make_pair(firstMutexIndex, secondMutexIndex);
}

template <typename NonMovableType>
std::vector<std::unique_ptr<NonMovableType>> makeVector(int num) {
  auto vector = std::vector<std::unique_ptr<NonMovableType>>{};
  vector.reserve(num);
  for (auto i = 0; i < num; ++i) {
    vector.push_back(std::make_unique<NonMovableType>());
  }
  return vector;
}

template <typename Mutex>
void ordered(
    std::size_t iters,
    int numThreads,
    std::vector<std::unique_ptr<Mutex>> mutexes) {
  auto suspender = BenchmarkSuspender{};

  // Sort the mutexes so there is no deadlock because of lock acquisition
  // ordering
  std::sort(mutexes.begin(), mutexes.end(), [](auto& one, auto& two) {
    return one.get() < two.get();
  });

  auto threads = std::vector<std::thread>{};
  auto&& barrier = BenchmarkStartBarrier{numThreads};

  for (auto thread = 0; thread < numThreads; ++thread) {
    threads.emplace_back([&mutexes, iters, thread, &barrier] {
      barrier.wait();

      auto indices = getMutexIndices(thread, mutexes.size());
      for (auto i = std::size_t{0}; i < iters; ++i) {
        // lock the mutexes
        mutexes[indices.first]->lock();
        mutexes[indices.second]->lock();

        spin(FLAGS_iterations);

        mutexes[indices.first]->unlock();
        mutexes[indices.second]->unlock();
      }
    });
  }

  barrier.wait();
  suspender.dismissing([&] {
    for (auto& thread : threads) {
      thread.join();
    }
  });
}

template <typename Mutex>
void smart(
    std::size_t iters,
    int numThreads,
    std::vector<std::unique_ptr<Mutex>> mutexes) {
  auto suspender = BenchmarkSuspender{};

  auto threads = std::vector<std::thread>{};
  auto&& barrier = BenchmarkStartBarrier{numThreads};

  for (auto thread = 0; thread < numThreads; ++thread) {
    threads.emplace_back([iters, &mutexes, thread, &barrier] {
      barrier.wait();

      auto indices = std::make_pair(
          thread % mutexes.size(), (thread + 1) % mutexes.size());
      for (auto iter = std::size_t{0}; iter < iters; ++iter) {
        while (true) {
          mutexes[indices.first]->lock();
          if (mutexes[indices.second]->try_lock()) {
            break;
          }

          mutexes[indices.first]->unlock();
          std::swap(indices.first, indices.second);
          std::this_thread::yield();
        }

        spin(FLAGS_iterations);

        mutexes[indices.first]->unlock();
        mutexes[indices.second]->unlock();
      }
    });
  }

  barrier.wait();
  suspender.dismissing([&] {
    for (auto& thread : threads) {
      thread.join();
    }
  });
}

template <typename Mutex>
void persistent(
    std::size_t iters,
    int numThreads,
    std::vector<std::unique_ptr<Mutex>> mutexes) {
  auto suspender = BenchmarkSuspender{};

  auto threads = std::vector<std::thread>{};
  auto&& barrier = BenchmarkStartBarrier{numThreads};

  for (auto thread = 0; thread < numThreads; ++thread) {
    threads.emplace_back([iters, &mutexes, thread, &barrier] {
      barrier.wait();

      auto indices = std::make_pair(
          thread % mutexes.size(), (thread + 1) % mutexes.size());
      for (auto iter = std::size_t{0}; iter < iters; ++iter) {
        // lock the mutexes by first locking a mutex and then acquiring the
        // next mutex (or mutexes) with a try_lock()
        while (true) {
          mutexes[indices.first]->lock();
          if (mutexes[indices.second]->try_lock()) {
            break;
          }

          mutexes[indices.first]->unlock();
        }

        spin(FLAGS_iterations);

        mutexes[indices.first]->unlock();
        mutexes[indices.second]->unlock();
      }
    });
  }

  barrier.wait();
  suspender.dismissing([&] {
    for (auto& thread : threads) {
      thread.join();
    }
  });
}

template <typename LockingFunc>
void simple(std::size_t iters, LockingFunc func) {
  auto&& suspender = BenchmarkSuspender{};
  auto&& one = std::mutex{};
  auto&& two = std::mutex{};
  auto&& barrier = BenchmarkStartBarrier{3};

  auto threadOne = std::thread{[&] {
    barrier.wait();

    for (auto i = std::size_t{0}; i < iters; ++i) {
      auto lckOne = std::unique_lock<std::mutex>{one, std::defer_lock};
      auto lckTwo = std::unique_lock<std::mutex>{two, std::defer_lock};
      func(lckOne, lckTwo);

      spin(FLAGS_iterations);
    }
  }};

  auto threadTwo = std::thread{[&] {
    barrier.wait();

    for (auto i = std::size_t{0}; i < iters; ++i) {
      auto lck = std::unique_lock<std::mutex>{one};
      spin(FLAGS_iterations * FLAGS_iterations);
    }
  }};

  auto threadThree = std::thread{[&] {
    barrier.wait();

    for (auto i = std::size_t{0}; i < iters; ++i) {
      auto lck = std::unique_lock<std::mutex>{two};
      spin(FLAGS_iterations * FLAGS_iterations);
    }
  }};

  barrier.wait();
  suspender.dismissing([&] {
    threadOne.join();
    threadTwo.join();
    threadThree.join();
  });
}

template <typename LockingFunc>
void pathological(std::size_t iters, LockingFunc func) {
  auto&& suspender = BenchmarkSuspender{};
  auto&& one = std::mutex{};
  auto&& two = std::mutex{};
  auto&& three = std::mutex{};
  auto&& barrier = BenchmarkStartBarrier{3};

  auto threadOne = std::thread{[&] {
    barrier.wait();

    for (auto i = std::size_t{0}; i < iters; ++i) {
      auto lckOne = std::unique_lock<std::mutex>{one, std::defer_lock};
      auto lckTwo = std::unique_lock<std::mutex>{two, std::defer_lock};
      auto lckThree = std::unique_lock<std::mutex>{three, std::defer_lock};
      func(lckOne, lckTwo, lckThree);

      spin(FLAGS_iterations);
    }
  }};

  auto threadTwo = std::thread{[&] {
    barrier.wait();

    for (auto i = std::size_t{0}; i < iters; ++i) {
      auto lck = std::unique_lock<std::mutex>{one};

      spin(FLAGS_iterations * FLAGS_iterations);
    }
  }};

  auto threadThree = std::thread{[&] {
    barrier.wait();

    for (auto i = std::size_t{0}; i < iters; ++i) {
      auto lckTwo = std::unique_lock<std::mutex>{two};
      auto lckThree = std::unique_lock<std::mutex>{three};

      spin(FLAGS_iterations * FLAGS_iterations);
    }
  }};

  barrier.wait();
  suspender.dismissing([&] {
    threadOne.join();
    threadTwo.join();
    threadThree.join();
  });
}

template <typename LockingFunc>
void uncontended(std::size_t iters, LockingFunc func) {
  auto&& suspender = BenchmarkSuspender{};
  auto&& one = std::mutex{};
  auto&& two = std::mutex{};

  suspender.dismissing([&] {
    for (auto i = std::size_t{0}; i < iters; ++i) {
      func(one, two);

      spin(FLAGS_iterations);

      one.unlock();
      two.unlock();
    }
  });
}

void spin(int iterations) {
  for (auto i = 0; i < iterations; ++i) {
    doNotOptimizeAway(i);
  }
}

} // namespace
