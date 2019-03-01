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

#include <thread>
#include <unordered_set>
#include <vector>

#include <folly/SingletonThreadLocal.h>
#include <folly/Synchronized.h>
#include <folly/portability/GTest.h>

using namespace folly;

namespace {
static std::atomic<std::size_t> fooCreatedCount{0};
static std::atomic<std::size_t> fooDeletedCount{0};
struct Foo {
  Foo() {
    ++fooCreatedCount;
  }
  ~Foo() {
    ++fooDeletedCount;
  }
};
using FooSingletonTL = SingletonThreadLocal<Foo>;
FooSingletonTL theFooSingleton;
}

TEST(SingletonThreadLocalTest, OneSingletonPerThread) {
  const std::size_t targetThreadCount{64};
  std::atomic<std::size_t> completedThreadCount{0};
  Synchronized<std::unordered_set<Foo*>> fooAddresses{};
  std::vector<std::thread> threads{};
  auto threadFunction =
      [&fooAddresses, targetThreadCount, &completedThreadCount] {
        fooAddresses.wlock()->emplace(&FooSingletonTL::get());
        ++completedThreadCount;
        while (completedThreadCount < targetThreadCount) {
          std::this_thread::yield();
        }
      };
  {
    for (std::size_t threadCount{0}; threadCount < targetThreadCount;
         ++threadCount) {
      threads.emplace_back(threadFunction);
    }
  }
  for (auto& thread : threads) {
    thread.join();
  }
  EXPECT_EQ(threads.size(), fooAddresses.rlock()->size());
  EXPECT_EQ(threads.size(), fooCreatedCount);
  EXPECT_EQ(threads.size(), fooDeletedCount);
}
