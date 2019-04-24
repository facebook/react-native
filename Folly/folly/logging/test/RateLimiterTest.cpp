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
#include <condition_variable>
#include <mutex>
#include <string>
#include <thread>

#include <folly/Conv.h>
#include <folly/logging/RateLimiter.h>
#include <folly/portability/GTest.h>

using folly::logging::IntervalRateLimiter;
using std::chrono::duration_cast;
using namespace std::literals::chrono_literals;

using irl_clock = IntervalRateLimiter::clock;

void intervalTest(uint64_t eventsPerInterval, irl_clock::duration interval) {
  SCOPED_TRACE(folly::to<std::string>(
      eventsPerInterval,
      " events every ",
      duration_cast<std::chrono::milliseconds>(interval).count(),
      "ms"));
  IntervalRateLimiter limiter{eventsPerInterval, interval};
  for (int iter = 0; iter < 4; ++iter) {
    if (iter != 0) {
      auto now = irl_clock::now();
      auto const deadline = now + interval;
      while (now < deadline) {
        /* sleep override */
        std::this_thread::sleep_for(now - deadline);
        now = irl_clock::now();
      }
    }
    for (uint64_t n = 0; n < eventsPerInterval * 2; ++n) {
      if (n < eventsPerInterval) {
        EXPECT_TRUE(limiter.check())
            << "expected check success on loop " << iter << " event " << n;
      } else {
        EXPECT_FALSE(limiter.check())
            << "expected check failure on loop " << iter << " event " << n;
      }
    }
  }
}

TEST(RateLimiter, interval3per100ms) {
  intervalTest(3, 100ms);
}

TEST(RateLimiter, interval1per100ms) {
  intervalTest(1, 100ms);
}

TEST(RateLimiter, interval15per150ms) {
  intervalTest(15, 150ms);
}

TEST(RateLimiter, concurrentThreads) {
  constexpr uint64_t maxEvents = 20;
  constexpr uint64_t numThreads = 32;

  IntervalRateLimiter limiter{20, 10s};
  std::atomic<uint32_t> count{0};
  std::mutex m;
  std::condition_variable cv;
  bool go = false;

  auto threadMain = [&]() {
    // Have each thread wait for go to become true before starting.
    // This hopefully gives us the best chance of having all threads start
    // at close to the same time.
    {
      std::unique_lock<std::mutex> lock{m};
      cv.wait(lock, [&go] { return go; });
    }

    for (uint64_t iteration = 0; iteration < maxEvents * 2; ++iteration) {
      if (limiter.check()) {
        count.fetch_add(1, std::memory_order_relaxed);
      }
    }
  };

  // Start the threads
  std::vector<std::thread> threads;
  threads.reserve(numThreads);
  for (uint64_t n = 0; n < numThreads; ++n) {
    threads.emplace_back(threadMain);
  }

  // Set go to true and notify all the threads
  {
    std::lock_guard<std::mutex> lg(m);
    go = true;
  }
  cv.notify_all();

  // Wait for all of the threads
  for (auto& thread : threads) {
    thread.join();
  }

  // We should have passed the check exactly maxEvents times
  EXPECT_EQ(maxEvents, count.load(std::memory_order_relaxed));
}
