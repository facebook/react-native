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
#include <folly/ThreadLocal.h>
#include <condition_variable>
#include <mutex>
#include <thread>

using namespace folly;

template <typename Tag1, typename Tag2>
void runTestTag(int iters, int numThreads) {
  BenchmarkSuspender susp;

  ThreadLocalPtr<int, Tag1> t1;

  t1.reset(new int(1));

  std::mutex m, mw;
  std::condition_variable cv, cvw;
  bool running = true;
  int numRunning = 0;

  std::vector<std::thread> threads;
  for (int i = 0; i < numThreads; i++) {
    threads.push_back(std::thread([&]() mutable {
      t1.reset(new int(1));

      // notify if all the threads have created the t1
      bool notify = false;
      {
        std::lock_guard<std::mutex> lk(m);
        if (++numRunning == numThreads) {
          notify = true;
        }
      }

      if (notify) {
        cv.notify_one();
      }

      // now wait
      {
        std::unique_lock<std::mutex> lk(mw);
        cvw.wait(lk, [&]() { return !running; });
      }
    }));
  }

  // wait for the threads to create the t1
  {
    std::unique_lock<std::mutex> lk(m);
    cv.wait(lk, [&]() { return numRunning == numThreads; });
  }

  ThreadLocalPtr<int, Tag2> t3;
  t3.reset(new int(2));

  susp.dismiss();

  // run the test loop
  for (int i = 0; i < iters; i++) {
    ThreadLocalPtr<int, Tag2> t2;
    t2.reset(new int(2));
  }

  susp.rehire();

  {
    std::lock_guard<std::mutex> lk(mw);
    running = false;
  }

  cvw.notify_all();

  for (auto& t : threads) {
    t.join();
  }
}

void runTestSameTag(int iters, int numThreads) {
  runTestTag<void, void>(iters, numThreads);
}

void runTestDiffTag(int iters, int numThreads) {
  runTestTag<void, int>(iters, numThreads);
}

BENCHMARK_DRAW_LINE();
BENCHMARK_PARAM(runTestSameTag, 1)
BENCHMARK_PARAM(runTestSameTag, 128)
BENCHMARK_PARAM(runTestSameTag, 256)
BENCHMARK_PARAM(runTestSameTag, 512)
BENCHMARK_PARAM(runTestSameTag, 1024)
BENCHMARK_PARAM(runTestSameTag, 2048)
BENCHMARK_DRAW_LINE();
BENCHMARK_PARAM(runTestDiffTag, 1)
BENCHMARK_PARAM(runTestDiffTag, 128)
BENCHMARK_PARAM(runTestDiffTag, 256)
BENCHMARK_PARAM(runTestDiffTag, 512)
BENCHMARK_PARAM(runTestDiffTag, 1024)
BENCHMARK_PARAM(runTestDiffTag, 2048)
BENCHMARK_DRAW_LINE();

int main(int argc, char* argv[]) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  folly::runBenchmarks();

  return 0;
}
