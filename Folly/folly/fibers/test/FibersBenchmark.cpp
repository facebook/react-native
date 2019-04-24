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

#include <folly/fibers/FiberManager.h>
#include <folly/fibers/FiberManagerMap.h>

#include <queue>

#include <folly/Benchmark.h>
#include <folly/fibers/SimpleLoopController.h>
#include <folly/init/Init.h>
#include <folly/io/async/EventBase.h>

using namespace folly::fibers;

static size_t sNumAwaits;

void runBenchmark(size_t numAwaits, size_t toSend) {
  sNumAwaits = numAwaits;

  FiberManager fiberManager(std::make_unique<SimpleLoopController>());
  auto& loopController =
      dynamic_cast<SimpleLoopController&>(fiberManager.loopController());

  std::queue<Promise<int>> pendingRequests;
  static const size_t maxOutstanding = 5;

  auto loop = [&fiberManager, &loopController, &pendingRequests, &toSend]() {
    if (pendingRequests.size() == maxOutstanding || toSend == 0) {
      if (pendingRequests.empty()) {
        return;
      }
      pendingRequests.front().setValue(0);
      pendingRequests.pop();
    } else {
      fiberManager.addTask([&pendingRequests]() {
        for (size_t i = 0; i < sNumAwaits; ++i) {
          auto result = await([&pendingRequests](Promise<int> promise) {
            pendingRequests.push(std::move(promise));
          });
          DCHECK_EQ(result, 0);
        }
      });

      if (--toSend == 0) {
        loopController.stop();
      }
    }
  };

  loopController.loop(std::move(loop));
}

BENCHMARK(FiberManagerBasicOneAwait, iters) {
  runBenchmark(1, iters);
}

BENCHMARK(FiberManagerBasicFiveAwaits, iters) {
  runBenchmark(5, iters);
}

BENCHMARK(FiberManagerCreateDestroy, iters) {
  for (size_t i = 0; i < iters; ++i) {
    folly::EventBase evb;
    auto& fm = folly::fibers::getFiberManager(evb);
    fm.addTask([]() {});
    evb.loop();
  }
}

BENCHMARK(FiberManagerAllocateDeallocatePattern, iters) {
  static const size_t kNumAllocations = 10000;

  FiberManager::Options opts;
  opts.maxFibersPoolSize = 0;

  FiberManager fiberManager(std::make_unique<SimpleLoopController>(), opts);

  for (size_t iter = 0; iter < iters; ++iter) {
    DCHECK_EQ(0, fiberManager.fibersPoolSize());

    size_t fibersRun = 0;

    for (size_t i = 0; i < kNumAllocations; ++i) {
      fiberManager.addTask([&fibersRun] { ++fibersRun; });
      fiberManager.loopUntilNoReady();
    }

    DCHECK_EQ(10000, fibersRun);
    DCHECK_EQ(0, fiberManager.fibersPoolSize());
  }
}

BENCHMARK(FiberManagerAllocateLargeChunk, iters) {
  static const size_t kNumAllocations = 10000;

  FiberManager::Options opts;
  opts.maxFibersPoolSize = 0;

  FiberManager fiberManager(std::make_unique<SimpleLoopController>(), opts);

  for (size_t iter = 0; iter < iters; ++iter) {
    DCHECK_EQ(0, fiberManager.fibersPoolSize());

    size_t fibersRun = 0;

    for (size_t i = 0; i < kNumAllocations; ++i) {
      fiberManager.addTask([&fibersRun] { ++fibersRun; });
    }

    fiberManager.loopUntilNoReady();

    DCHECK_EQ(10000, fibersRun);
    DCHECK_EQ(0, fiberManager.fibersPoolSize());
  }
}

int main(int argc, char** argv) {
  folly::init(&argc, &argv, true);

  folly::runBenchmarks();
  return 0;
}
