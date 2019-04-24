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
} // namespace

TEST(SingletonThreadLocalTest, OneSingletonPerThread) {
  static constexpr std::size_t targetThreadCount{64};
  std::atomic<std::size_t> completedThreadCount{0};
  Synchronized<std::unordered_set<Foo*>> fooAddresses{};
  std::vector<std::thread> threads{};
  auto threadFunction = [&fooAddresses, &completedThreadCount] {
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

TEST(SingletonThreadLocalTest, MoveConstructibleMake) {
  struct Foo {
    int a, b;
    Foo(int a_, int b_) : a(a_), b(b_) {}
    Foo(Foo&&) = default;
    Foo& operator=(Foo&&) = default;
  };
  struct Tag {};
  struct Make {
    Foo operator()() const {
      return Foo(3, 4);
    }
  };
  auto& single = SingletonThreadLocal<Foo, Tag, Make>::get();
  EXPECT_EQ(4, single.b);
}

TEST(SingletonThreadLocalTest, NotMoveConstructibleMake) {
  struct Foo {
    int a, b;
    Foo(int a_, int b_) : a(a_), b(b_) {}
    Foo(Foo&&) = delete;
    Foo& operator=(Foo&&) = delete;
  };
  struct Tag {};
  struct Make {
    Foo* operator()(unsigned char (&buf)[sizeof(Foo)]) const {
      return new (buf) Foo(3, 4);
    }
  };
  auto& single = SingletonThreadLocal<Foo, Tag, Make>::get();
  EXPECT_EQ(4, single.b);
}

TEST(SingletonThreadLocalTest, AccessAfterFastPathDestruction) {
  static std::atomic<int> counter{};
  struct Foo {
    int i = 3;
  };
  struct Bar {
    ~Bar() {
      counter += SingletonThreadLocal<Foo>::get().i;
    }
  };
  auto th = std::thread([] {
    SingletonThreadLocal<Bar>::get();
    counter += SingletonThreadLocal<Foo>::get().i;
  });
  th.join();
  EXPECT_EQ(6, counter);
}

TEST(ThreadLocal, DependencyTest) {
  typedef folly::ThreadLocalPtr<int> Data;

  struct mytag {};

  typedef SingletonThreadLocal<int> SingletonInt;
  struct barstruct {
    ~barstruct() {
      SingletonInt::get()++;
      Data data;
      data.reset(new int(0));
    }
  };
  typedef SingletonThreadLocal<barstruct, mytag> BarSingleton;

  std::thread([&]() {
    Data data;
    data.reset(new int(0));
    SingletonInt::get();
    BarSingleton::get();
  })
      .join();
}

TEST(SingletonThreadLocalTest, Reused) {
  for (auto i = 0u; i < 2u; ++i) {
    FOLLY_DECLARE_REUSED(data, std::string);
    if (i == 0u) {
      data = "hello";
    }
    EXPECT_EQ(i == 0u ? "hello" : "", data);
  }
}
