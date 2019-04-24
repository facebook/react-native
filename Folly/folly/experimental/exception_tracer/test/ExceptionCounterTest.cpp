/*
 * Copyright 2016-present Facebook, Inc.
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

#include <condition_variable>
#include <mutex>
#include <sstream>
#include <stdexcept>
#include <thread>

#include <folly/experimental/exception_tracer/ExceptionCounterLib.h>
#include <folly/portability/GTest.h>

struct MyException {};

// clang-format off
[[noreturn]] void bar() {
  throw std::runtime_error("hello");
}

[[noreturn]] void foo() {
  throw MyException();
}

[[noreturn]] void baz() {
  foo();
}
// clang-format on

using namespace folly::exception_tracer;

template <typename F>
void throwAndCatch(F f) {
  try {
    f();
  } catch (...) {
    // ignore
  }
}

TEST(ExceptionCounter, oneThread) {
  throwAndCatch(foo);

  // Use volatile to prevent loop unrolling (it screws up stack frame grouping).
  for (volatile int i = 0; i < 10; ++i) {
    throwAndCatch(bar);
  }

  auto stats = getExceptionStatistics();
  EXPECT_EQ(stats.size(), 2);
  EXPECT_EQ(stats[0].count, 10);
  EXPECT_EQ(stats[1].count, 1);
  EXPECT_EQ(*(stats[0].info.type), typeid(std::runtime_error));
  EXPECT_EQ(*(stats[1].info.type), typeid(MyException));
}

TEST(ExceptionCounter, testClearExceptionStatistics) {
  throwAndCatch(foo);
  auto stats = getExceptionStatistics();
  EXPECT_EQ(stats.size(), 1);
  stats = getExceptionStatistics();
  EXPECT_EQ(stats.size(), 0);
}

TEST(ExceptionCounter, testDifferentStacks) {
  throwAndCatch(foo);
  throwAndCatch(baz);
  auto stats = getExceptionStatistics();
  EXPECT_EQ(stats.size(), 2);
}

TEST(ExceptionCounter, multyThreads) {
  constexpr size_t kNumIterations = 10000;
  constexpr size_t kNumThreads = 10;
  std::vector<std::thread> threads;
  threads.resize(kNumThreads);

  std::mutex preparedMutex;
  std::mutex finishedMutex;
  std::condition_variable preparedBarrier;
  std::condition_variable finishedBarrier;
  int preparedThreads = 0;
  bool finished = false;

  for (auto& t : threads) {
    t = std::thread([&]() {
      for (size_t i = 0; i < kNumIterations; ++i) {
        throwAndCatch(foo);
      }

      {
        std::unique_lock<std::mutex> lock(preparedMutex);
        ++preparedThreads;
        preparedBarrier.notify_one();
      }

      std::unique_lock<std::mutex> lock(finishedMutex);
      finishedBarrier.wait(lock, [&]() { return finished; });
    });
  }

  {
    std::unique_lock<std::mutex> lock(preparedMutex);
    preparedBarrier.wait(
        lock, [&]() { return preparedThreads == kNumThreads; });
  }

  auto stats = getExceptionStatistics();
  EXPECT_EQ(stats.size(), 1);
  EXPECT_EQ(stats[0].count, kNumIterations * kNumThreads);

  {
    std::unique_lock<std::mutex> lock(finishedMutex);
    finished = true;
    finishedBarrier.notify_all();
  }

  for (auto& t : threads) {
    t.join();
  }
}
