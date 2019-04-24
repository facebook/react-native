/*
 * Copyright 2018-present Facebook, Inc.
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

#include <folly/synchronization/Tearable.h>

#include <atomic>
#include <thread>

#include <folly/portability/GTest.h>

using namespace folly;

namespace {

struct Data {
  Data(unsigned char value) {
    setValue(value);
  }

  void setValue(unsigned char value) {
    for (auto& item : contents) {
      item = value;
    }
  }

  void checkValue(unsigned char value) {
    for (auto& item : contents) {
      ASSERT_EQ(value, item);
    }
  }

  void checkValue2(unsigned char value1, unsigned char value2) {
    for (auto& item : contents) {
      ASSERT_TRUE(item == value1 || item == value2);
    }
  }

  // Note the odd size -- this will hopefully expose layout bugs under
  // sanitizers.
  unsigned char contents[99];
};
static_assert(is_trivially_copyable<Data>::value, "not trivially-copyable");

TEST(TearableTest, BasicOperations) {
  Tearable<Data> tearable;
  Data src(0);
  Data dst(1);
  for (char c = 0; c < 10; ++c) {
    src.setValue(c);
    tearable.store(src);
    tearable.load(dst);
    dst.checkValue(c);
  }
}

TEST(TearableTest, Races) {
  std::atomic<bool> stop(false);
  Tearable<Data> tearable(Data(1));
  std::thread write1([&]() {
    Data data0(1);
    while (!stop.load(std::memory_order_relaxed)) {
      tearable.store(data0);
    }
  });
  std::thread write2([&]() {
    Data data1(2);
    while (!stop.load(std::memory_order_relaxed)) {
      tearable.store(data1);
    }
  });
  Data val(0);
  for (int i = 0; i < 100 * 1000; ++i) {
    tearable.load(val);
    val.checkValue2(1, 2);
  }
  stop.store(true, std::memory_order_relaxed);
  write1.join();
  write2.join();
}

} // namespace
