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

#include <chrono>

#include <folly/executors/CPUThreadPoolExecutor.h>
#include <folly/executors/InlineExecutor.h>
#include <folly/executors/SerialExecutor.h>
#include <folly/portability/GTest.h>
#include <folly/synchronization/Baton.h>

using namespace std::chrono;
using folly::SerialExecutor;

namespace {
void burnMs(uint64_t ms) {
  /* sleep override */ std::this_thread::sleep_for(milliseconds(ms));
}
} // namespace

void SimpleTest(std::shared_ptr<folly::Executor> const& parent) {
  auto executor =
      SerialExecutor::create(folly::getKeepAliveToken(parent.get()));

  std::vector<int> values;
  std::vector<int> expected;

  for (int i = 0; i < 20; ++i) {
    executor->add([i, &values] {
      // make this extra vulnerable to concurrent execution
      values.push_back(0);
      burnMs(10);
      values.back() = i;
    });
    expected.push_back(i);
  }

  // wait until last task has executed
  folly::Baton<> finished_baton;
  executor->add([&finished_baton] { finished_baton.post(); });
  finished_baton.wait();

  EXPECT_EQ(expected, values);
}

TEST(SerialExecutor, Simple) {
  SimpleTest(std::make_shared<folly::CPUThreadPoolExecutor>(4));
}
TEST(SerialExecutor, SimpleInline) {
  SimpleTest(std::make_shared<folly::InlineExecutor>());
}

// The Afterlife test only works with an asynchronous executor (not the
// InlineExecutor), because we want execution of tasks to happen after we
// destroy the SerialExecutor
TEST(SerialExecutor, Afterlife) {
  auto cpu_executor = std::make_shared<folly::CPUThreadPoolExecutor>(4);
  auto executor =
      SerialExecutor::create(folly::getKeepAliveToken(cpu_executor.get()));

  // block executor until we call start_baton.post()
  folly::Baton<> start_baton;
  executor->add([&start_baton] { start_baton.wait(); });

  std::vector<int> values;
  std::vector<int> expected;

  for (int i = 0; i < 20; ++i) {
    executor->add([i, &values] {
      // make this extra vulnerable to concurrent execution
      values.push_back(0);
      burnMs(10);
      values.back() = i;
    });
    expected.push_back(i);
  }

  folly::Baton<> finished_baton;
  executor->add([&finished_baton] { finished_baton.post(); });

  // destroy SerialExecutor
  executor.reset();

  // now kick off the tasks
  start_baton.post();

  // wait until last task has executed
  finished_baton.wait();

  EXPECT_EQ(expected, values);
}

void RecursiveAddTest(std::shared_ptr<folly::Executor> const& parent) {
  auto executor =
      SerialExecutor::create(folly::getKeepAliveToken(parent.get()));

  folly::Baton<> finished_baton;

  std::vector<int> values;
  std::vector<int> expected = {{0, 1, 2, 3, 4, 5, 6, 7, 8, 9}};

  int i = 0;
  std::function<void()> lambda = [&] {
    if (i < 10) {
      // make this extra vulnerable to concurrent execution
      values.push_back(0);
      burnMs(10);
      values.back() = i;
      executor->add(lambda);
    } else if (i < 12) {
      // Below we will post this lambda three times to the executor. When
      // executed, the lambda will re-post itself during the first ten
      // executions. Afterwards we do nothing twice (this else-branch), and
      // then on the 13th execution signal that we are finished.
    } else {
      finished_baton.post();
    }
    ++i;
  };

  executor->add(lambda);
  executor->add(lambda);
  executor->add(lambda);

  // wait until last task has executed
  finished_baton.wait();

  EXPECT_EQ(expected, values);
}

TEST(SerialExecutor, RecursiveAdd) {
  RecursiveAddTest(std::make_shared<folly::CPUThreadPoolExecutor>(4));
}
TEST(SerialExecutor, RecursiveAddInline) {
  RecursiveAddTest(std::make_shared<folly::InlineExecutor>());
}

TEST(SerialExecutor, ExecutionThrows) {
  auto executor = SerialExecutor::create();

  // an empty Func will throw std::bad_function_call when invoked,
  // but SerialExecutor should catch that exception
  executor->add(folly::Func{});
}
