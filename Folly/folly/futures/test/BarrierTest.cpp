/*
 * Copyright 2015-present Facebook, Inc.
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

#include <folly/futures/Barrier.h>

#include <atomic>
#include <condition_variable>
#include <mutex>

#include <folly/Random.h>
#include <folly/portability/GTest.h>

#include <glog/logging.h>

namespace folly {
namespace futures {
namespace test {

TEST(BarrierTest, Simple) {
  constexpr uint32_t numThreads = 10;

  std::mutex mutex;
  std::condition_variable b1DoneCond;
  std::condition_variable b2DoneCond;
  std::atomic<uint32_t> b1TrueSeen(0);
  std::atomic<uint32_t> b1Passed(0);
  std::atomic<uint32_t> b2TrueSeen(0);
  std::atomic<uint32_t> b2Passed(0);

  Barrier barrier(numThreads + 1);

  std::vector<std::thread> threads;
  threads.reserve(numThreads);
  for (uint32_t i = 0; i < numThreads; ++i) {
    threads.emplace_back([&]() {
      barrier.wait()
          .then([&](bool v) {
            std::unique_lock<std::mutex> lock(mutex);
            b1TrueSeen += uint32_t(v);
            if (++b1Passed == numThreads) {
              b1DoneCond.notify_one();
            }
            return barrier.wait();
          })
          .then([&](bool v) {
            std::unique_lock<std::mutex> lock(mutex);
            b2TrueSeen += uint32_t(v);
            if (++b2Passed == numThreads) {
              b2DoneCond.notify_one();
            }
          })
          .get();
    });
  }

  /* sleep override */
  std::this_thread::sleep_for(std::chrono::milliseconds(50));
  EXPECT_EQ(0, b1Passed);
  EXPECT_EQ(0, b1TrueSeen);

  b1TrueSeen += barrier.wait().get();

  {
    std::unique_lock<std::mutex> lock(mutex);
    while (b1Passed != numThreads) {
      b1DoneCond.wait(lock);
    }
    EXPECT_EQ(1, b1TrueSeen);
  }

  /* sleep override */
  std::this_thread::sleep_for(std::chrono::milliseconds(50));
  EXPECT_EQ(0, b2Passed);
  EXPECT_EQ(0, b2TrueSeen);

  b2TrueSeen += barrier.wait().get();

  {
    std::unique_lock<std::mutex> lock(mutex);
    while (b2Passed != numThreads) {
      b2DoneCond.wait(lock);
    }
    EXPECT_EQ(1, b2TrueSeen);
  }

  for (auto& t : threads) {
    t.join();
  }
}

TEST(BarrierTest, Random) {
  // Create numThreads threads.
  //
  // Each thread repeats the following numIterations times:
  //   - grab a randomly chosen number of futures from the barrier, waiting
  //     for a short random time between each
  //   - wait for all futures to complete
  //   - record whether the one future returning true was seen among them
  //
  // At the end, we verify that exactly one future returning true was seen
  // for each iteration.
  static constexpr uint32_t numIterations = 1;
  auto numThreads = folly::Random::rand32(30, 91);

  struct ThreadInfo {
    ThreadInfo() {}
    std::thread thread;
    uint32_t iteration = 0;
    uint32_t numFutures;
    std::vector<uint32_t> trueSeen;
  };

  std::vector<ThreadInfo> threads;
  threads.resize(numThreads);

  uint32_t totalFutures = 0;
  for (auto& tinfo : threads) {
    tinfo.numFutures = folly::Random::rand32(100);
    tinfo.trueSeen.resize(numIterations);
    totalFutures += tinfo.numFutures;
  }

  Barrier barrier(totalFutures);

  for (auto& tinfo : threads) {
    auto pinfo = &tinfo;
    tinfo.thread = std::thread([pinfo, &barrier] {
      std::vector<folly::Future<bool>> futures;
      futures.reserve(pinfo->numFutures);
      for (uint32_t i = 0; i < numIterations; ++i, ++pinfo->iteration) {
        futures.clear();
        for (uint32_t j = 0; j < pinfo->numFutures; ++j) {
          futures.push_back(barrier.wait());
          auto nanos = folly::Random::rand32(10 * 1000 * 1000);
          /* sleep override */
          std::this_thread::sleep_for(std::chrono::nanoseconds(nanos));
        }
        auto results = folly::collect(futures).get();
        pinfo->trueSeen[i] = std::count(results.begin(), results.end(), true);
      }
    });
  }

  for (auto& tinfo : threads) {
    tinfo.thread.join();
    EXPECT_EQ(numIterations, tinfo.iteration);
  }

  for (uint32_t i = 0; i < numIterations; ++i) {
    uint32_t trueCount = 0;
    for (auto& tinfo : threads) {
      trueCount += tinfo.trueSeen[i];
    }
    EXPECT_EQ(1, trueCount);
  }
}

} // namespace test
} // namespace futures
} // namespace folly
