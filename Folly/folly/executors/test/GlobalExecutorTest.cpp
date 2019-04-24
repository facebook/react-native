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

#include <folly/executors/GlobalExecutor.h>
#include <folly/executors/IOExecutor.h>
#include <folly/portability/GTest.h>

using namespace folly;

TEST(GlobalExecutorTest, GlobalCPUExecutor) {
  class DummyExecutor : public folly::Executor {
   public:
    void add(Func f) override {
      f();
      count++;
    }
    int count{0};
  };

  // The default CPU executor is a synchronous inline executor, lets verify
  // that work we add is executed
  auto count = 0;
  auto f = [&]() { count++; };

  // Don't explode, we should create the default global CPUExecutor lazily here.
  getCPUExecutor()->add(f);
  EXPECT_EQ(1, count);

  {
    auto dummy = std::make_shared<DummyExecutor>();
    setCPUExecutor(dummy);
    getCPUExecutor()->add(f);
    // Make sure we were properly installed.
    EXPECT_EQ(1, dummy->count);
    EXPECT_EQ(2, count);
  }

  // Don't explode, we should restore the default global CPUExecutor because our
  // weak reference to dummy has expired
  getCPUExecutor()->add(f);
  EXPECT_EQ(3, count);
}

TEST(GlobalExecutorTest, GlobalIOExecutor) {
  class DummyExecutor : public IOExecutor {
   public:
    void add(Func) override {
      count++;
    }
    folly::EventBase* getEventBase() override {
      return nullptr;
    }
    int count{0};
  };

  auto f = []() {};

  // Don't explode, we should create the default global IOExecutor lazily here.
  getIOExecutor()->add(f);

  {
    auto dummy = std::make_shared<DummyExecutor>();
    setIOExecutor(dummy);
    getIOExecutor()->add(f);
    // Make sure we were properly installed.
    EXPECT_EQ(1, dummy->count);
  }

  // Don't explode, we should restore the default global IOExecutor because our
  // weak reference to dummy has expired
  getIOExecutor()->add(f);
}
