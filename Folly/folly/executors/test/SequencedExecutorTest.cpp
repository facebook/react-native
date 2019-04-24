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

#include <future>

#include <folly/executors/CPUThreadPoolExecutor.h>
#include <folly/executors/SerialExecutor.h>
#include <folly/io/async/ScopedEventBaseThread.h>

#include <folly/portability/GTest.h>

namespace folly {

bool isSequencedExecutor(folly::Executor& executor) {
  // Add can be called from different threads, but it should be sequenced.
  auto cpuExecutor = std::make_shared<CPUThreadPoolExecutor>(4);
  auto producer =
      SerialExecutor::create(Executor::getKeepAliveToken(cpuExecutor.get()));

  std::atomic<size_t> nextCallIndex{0};
  std::atomic<bool> result{true};

  auto joinPromise = std::make_shared<std::promise<void>>();
  auto joinFuture = joinPromise->get_future();

  constexpr size_t kNumCalls = 10000;
  for (size_t callIndex = 0; callIndex < kNumCalls; ++callIndex) {
    producer->add([&result, &executor, &nextCallIndex, callIndex, joinPromise] {
      executor.add([&result, &nextCallIndex, callIndex, joinPromise] {
        if (nextCallIndex != callIndex) {
          result = false;
        }
        std::this_thread::yield();
        if (nextCallIndex.exchange(callIndex + 1) != callIndex) {
          result = false;
        }
      });
    });
  }

  joinPromise.reset();
  joinFuture.wait();

  return result;
}

void testExecutor(folly::Executor& executor) {
  EXPECT_FALSE(isSequencedExecutor(executor));
}

void testExecutor(folly::SequencedExecutor& executor) {
  EXPECT_TRUE(isSequencedExecutor(executor));
}

TEST(SequencedExecutor, CPUThreadPoolExecutor) {
  CPUThreadPoolExecutor executor(4);
  testExecutor(executor);
}

TEST(SequencedExecutor, SerialCPUThreadPoolExecutor) {
  auto cpuExecutor = std::make_shared<CPUThreadPoolExecutor>(4);
  auto executor =
      SerialExecutor::create(Executor::getKeepAliveToken(cpuExecutor.get()));
  testExecutor(*executor);
}

TEST(SequencedExecutor, EventBase) {
  testExecutor(*ScopedEventBaseThread().getEventBase());
}

} // namespace folly
