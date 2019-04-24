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

#include <folly/Benchmark.h>
#include <folly/io/async/EventBase.h>
#include <folly/synchronization/Baton.h>
#include <condition_variable>
#include <mutex>
#include <thread>

using namespace folly;

static size_t constexpr kMaxRead = 20;

void runTest(int iters, int numThreads) {
  BenchmarkSuspender susp;
  EventBase evb;
  evb.setMaxReadAtOnce(kMaxRead);

  std::mutex m;
  std::condition_variable cv;
  int numRunning = 0;
  int numProcessed = 0;
  int numTotal = iters * numThreads;

  std::vector<std::thread> threads;
  for (int i = 0; i < numThreads; i++) {
    threads.push_back(std::thread([&]() mutable {
      // wait for all the threads to start up
      bool notifyAll = false;
      {
        std::lock_guard<std::mutex> lk(m);
        if (++numRunning == numThreads) {
          notifyAll = true;
          susp.dismiss();
        }
      }

      if (notifyAll) {
        cv.notify_all();
      } else {
        std::unique_lock<std::mutex> lk(m);
        cv.wait(lk, [&]() { return numRunning == numThreads; });
      }

      for (auto j = 0; j < iters; j++) {
        evb.runInEventBaseThread([&]() mutable {
          if (++numProcessed == numTotal) {
            evb.terminateLoopSoon();
            ;
          }
        });
      }
    }));
  }

  evb.loopForever();
  susp.rehire();

  for (auto& t : threads) {
    t.join();
  }
}

BENCHMARK_PARAM(runTest, 1)
BENCHMARK_PARAM(runTest, 2)
BENCHMARK_PARAM(runTest, 4)
BENCHMARK_PARAM(runTest, 8)
BENCHMARK_PARAM(runTest, 16)
BENCHMARK_PARAM(runTest, 32)

int main(int argc, char* argv[]) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();

  return 0;
}
