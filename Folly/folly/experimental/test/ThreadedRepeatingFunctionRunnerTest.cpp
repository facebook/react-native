/*
 * Copyright 2013-present Facebook, Inc.
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
#include <folly/experimental/ThreadedRepeatingFunctionRunner.h>

#include <folly/portability/GTest.h>
#include <atomic>

using namespace std;

struct Foo {
  explicit Foo(std::atomic<int>& d) : data(d) {}
  ~Foo() {
    runner_.stop();
  }

  void start() {
    runner_.add("Foo", [this]() {
      ++data;
      return std::chrono::seconds(0);
    });
  }

  std::atomic<int>& data;
  folly::ThreadedRepeatingFunctionRunner runner_; // Must be declared last
};

struct FooLongSleep {
  explicit FooLongSleep(std::atomic<int>& d) : data(d) {}
  ~FooLongSleep() {
    runner_.stop();
    data.store(-1);
  }

  void start() {
    runner_.add("FooLongSleep", [this]() {
      data.store(1);
      return 1000h; // Test would time out if we waited
    });
  }

  std::atomic<int>& data;
  folly::ThreadedRepeatingFunctionRunner runner_; // Must be declared last
};

TEST(TestThreadedRepeatingFunctionRunner, HandleBackgroundLoop) {
  std::atomic<int> data(0);
  {
    Foo f(data);
    EXPECT_EQ(0, data.load());
    f.start(); // Runs increment thread in background
    while (data.load() == 0) {
      /* sleep override */ this_thread::sleep_for(chrono::milliseconds(10));
    }
  }
  // The increment thread should have been destroyed
  auto prev_val = data.load();
  /* sleep override */ this_thread::sleep_for(chrono::milliseconds(100));
  EXPECT_EQ(data.load(), prev_val);
}

TEST(TestThreadedRepeatingFunctionRunner, HandleLongSleepingThread) {
  std::atomic<int> data(0);
  {
    FooLongSleep f(data);
    EXPECT_EQ(0, data.load());
    f.start();
    while (data.load() == 0) {
      /* sleep override */ this_thread::sleep_for(chrono::milliseconds(10));
    }
    EXPECT_EQ(1, data.load());
  }
  // Foo should have been destroyed, which stopped the thread!
  EXPECT_EQ(-1, data.load());
}
